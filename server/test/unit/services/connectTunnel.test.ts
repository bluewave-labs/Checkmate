import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { EventEmitter } from "node:events";
import { ConnectTunnel } from "../../../src/domain/connect/connect-tunnel.ts";
import type { ConnectEnrollment } from "../../../src/domain/connect/connect.type.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

const ENROLLMENT: ConnectEnrollment = {
	connectUrl: "wss://relay.checkmate.so/api/tunnel",
	agentId: "agent 1",
	token: `cmk_${"a".repeat(48)}`,
	apiUrl: "https://connect.checkmate.so",
};

const OK_RESPONSE = { statusCode: 200, headers: {}, body: Buffer.alloc(0) };

const setup = (opts: { failConstructions?: number; got?: jest.Mock<any> } = {}) => {
	jest.useFakeTimers();
	jest.spyOn(Math, "random").mockReturnValue(0.5);
	const sockets: FakeSocket[] = [];
	let failuresLeft = opts.failConstructions ?? 0;

	class FakeSocket extends EventEmitter {
		close = jest.fn((code?: number) => {
			this.emit("close", code ?? 1005, Buffer.from(""));
		});
		terminate = jest.fn(() => {
			this.emit("close", 1006, Buffer.from(""));
		});
		ping = jest.fn();
		send = jest.fn();
		readyState = 1;
		static OPEN = 1;

		constructor(
			public url: string,
			public options: { headers: Record<string, string> }
		) {
			super();
			if (failuresLeft > 0) {
				failuresLeft -= 1;
				throw new Error("Invalid URL");
			}
			sockets.push(this);
		}
	}

	const logger = createMockLogger();
	const got = opts.got ?? jest.fn<any>().mockResolvedValue(OK_RESPONSE);
	const settingsService = { getSettings: () => ({ port: "52345" }) };
	const tunnel = new ConnectTunnel(FakeSocket as any, got as any, settingsService as any, logger as any);
	const latest = () => sockets[sockets.length - 1];
	return { tunnel, sockets, latest, logger, got };
};

const request = (overrides: Record<string, unknown> = {}) => ({
	type: "request",
	id: "req-1",
	method: "GET",
	path: "/api/v1/monitors?page=1",
	headers: { authorization: "Bearer jwt", accept: "application/json" },
	body: null,
	...overrides,
});

const deliver = async (socket: EventEmitter, message: unknown) => {
	socket.emit("message", Buffer.from(typeof message === "string" ? message : JSON.stringify(message)));
	await jest.advanceTimersByTimeAsync(0);
};

const replies = (socket: { send: jest.Mock }) => socket.send.mock.calls.map(([raw]) => JSON.parse(raw as string));

const decode = (body: string | null) => (body === null ? null : Buffer.from(body, "base64").toString());

describe("ConnectTunnel", () => {
	afterEach(() => {
		jest.useRealTimers();
		jest.restoreAllMocks();
	});

	describe("start", () => {
		it("opens a socket to the relay with the agent id and bearer token", () => {
			const { tunnel, sockets } = setup();

			tunnel.start(ENROLLMENT);

			expect(sockets).toHaveLength(1);
			expect(sockets[0].url).toBe("wss://relay.checkmate.so/api/tunnel?agent=agent%201");
			expect(sockets[0].options.headers.authorization).toBe(`Bearer ${ENROLLMENT.token}`);
			expect(tunnel.status().connected).toBe(false);
		});

		it("reports connected once the socket opens", () => {
			const { tunnel, latest, logger } = setup();
			tunnel.start(ENROLLMENT);

			latest().emit("open");

			const status = tunnel.status();
			expect(status.connected).toBe(true);
			expect(status.lastConnectedAt).not.toBeNull();
			expect(status.lastError).toBeNull();
			expect(logger.info).toHaveBeenCalledWith({ agentId: "agent 1" }, "Connect tunnel connected");
		});

		it("closes the previous socket and ignores its late events when started again", () => {
			const { tunnel, sockets } = setup();
			tunnel.start(ENROLLMENT);
			const first = sockets[0];
			first.emit("open");

			tunnel.start({ ...ENROLLMENT, agentId: "agent-2" });

			expect(first.close).toHaveBeenCalledWith(1000, expect.any(String));
			expect(sockets).toHaveLength(2);
			first.emit("open");
			first.emit("close", 1006, Buffer.from(""));
			jest.advanceTimersByTime(60_000);
			expect(sockets).toHaveLength(2);
			expect(tunnel.status().connected).toBe(false);
		});

		it("retries when the socket can't be constructed", () => {
			const { tunnel, sockets } = setup({ failConstructions: 1 });

			tunnel.start(ENROLLMENT);

			expect(sockets).toHaveLength(0);
			expect(tunnel.status().lastError).toBe("Invalid URL");
			jest.advanceTimersByTime(1_000);
			expect(sockets).toHaveLength(1);
		});
	});

	describe("reconnecting", () => {
		it("reconnects after the back-off when the socket closes", () => {
			const { tunnel, sockets, latest } = setup();
			tunnel.start(ENROLLMENT);
			latest().emit("open");

			latest().emit("close", 1006, Buffer.from(""));

			const status = tunnel.status();
			expect(status.connected).toBe(false);
			expect(status.closeCode).toBe(1006);
			jest.advanceTimersByTime(999);
			expect(sockets).toHaveLength(1);
			jest.advanceTimersByTime(1);
			expect(sockets).toHaveLength(2);
		});

		it("doubles the back-off on each failure up to 30 seconds", () => {
			const { tunnel, sockets, latest } = setup();
			tunnel.start(ENROLLMENT);

			const delays: number[] = [];
			for (let i = 0; i < 7; i++) {
				const before = sockets.length;
				latest().emit("close", 1006, Buffer.from(""));
				let waited = 0;
				while (sockets.length === before) {
					jest.advanceTimersByTime(100);
					waited += 100;
				}
				delays.push(waited);
			}

			expect(delays).toEqual([1_000, 2_000, 4_000, 8_000, 16_000, 30_000, 30_000]);
		});

		it("resets the back-off after a successful open", () => {
			const { tunnel, sockets, latest } = setup();
			tunnel.start(ENROLLMENT);
			latest().emit("close", 1006, Buffer.from(""));
			jest.advanceTimersByTime(1_000);
			latest().emit("close", 1006, Buffer.from(""));
			jest.advanceTimersByTime(2_000);
			latest().emit("open");

			latest().emit("close", 1006, Buffer.from(""));

			jest.advanceTimersByTime(1_000);
			expect(sockets).toHaveLength(4);
		});

		it.each([4001, 4003])("waits 30 seconds after the relay rejects the credential (%i)", (code) => {
			const { tunnel, sockets, latest } = setup();
			tunnel.start(ENROLLMENT);

			latest().emit("close", code, Buffer.from(""));

			expect(tunnel.status().lastError).toBe(`unauthorized (${code})`);
			jest.advanceTimersByTime(29_999);
			expect(sockets).toHaveLength(1);
			jest.advanceTimersByTime(1);
			expect(sockets).toHaveLength(2);
		});

		it("records a socket error and closes the socket", () => {
			const { tunnel, latest } = setup();
			tunnel.start(ENROLLMENT);
			const socket = latest();

			socket.emit("error", new Error("getaddrinfo ENOTFOUND relay.checkmate.so"));

			expect(socket.close).toHaveBeenCalled();
			expect(tunnel.status().lastError).toBe("getaddrinfo ENOTFOUND relay.checkmate.so");
		});
	});

	describe("stop", () => {
		it("closes the socket and doesn't reconnect", () => {
			const { tunnel, sockets, latest } = setup();
			tunnel.start(ENROLLMENT);
			const socket = latest();
			socket.emit("open");

			tunnel.stop();

			expect(socket.close).toHaveBeenCalledWith(1000, expect.any(String));
			expect(tunnel.status().connected).toBe(false);
			jest.advanceTimersByTime(60_000);
			expect(sockets).toHaveLength(1);
		});

		it("cancels a pending reconnect", () => {
			const { tunnel, sockets, latest } = setup();
			tunnel.start(ENROLLMENT);
			latest().emit("close", 1006, Buffer.from(""));

			tunnel.stop();

			jest.advanceTimersByTime(60_000);
			expect(sockets).toHaveLength(1);
		});

		it("is safe to call when nothing was started, or twice", () => {
			const { tunnel } = setup();

			expect(() => {
				tunnel.stop();
				tunnel.stop();
			}).not.toThrow();
		});
	});

	describe("liveness", () => {
		it("pings every 15 seconds while the relay answers", () => {
			const { tunnel, latest } = setup();
			tunnel.start(ENROLLMENT);
			const socket = latest();
			socket.emit("open");

			jest.advanceTimersByTime(15_000);
			expect(socket.ping).toHaveBeenCalledTimes(1);
			socket.emit("pong");
			jest.advanceTimersByTime(15_000);

			expect(socket.ping).toHaveBeenCalledTimes(2);
			expect(socket.terminate).not.toHaveBeenCalled();
		});

		it("terminates and reconnects when a ping goes unanswered", () => {
			const { tunnel, sockets, latest, logger } = setup();
			tunnel.start(ENROLLMENT);
			const socket = latest();
			socket.emit("open");

			jest.advanceTimersByTime(30_000);

			expect(socket.terminate).toHaveBeenCalledTimes(1);
			const status = tunnel.status();
			expect(status.connected).toBe(false);
			expect(status.closeCode).toBe(1006);
			expect(status.lastError).toBe("relay stopped responding");
			expect(logger.warn).toHaveBeenCalledWith("Connect tunnel stopped responding; reconnecting");
			jest.advanceTimersByTime(1_000);
			expect(sockets).toHaveLength(2);
		});

		it("stops pinging once the tunnel is stopped", () => {
			const { tunnel, latest } = setup();
			tunnel.start(ENROLLMENT);
			const socket = latest();
			socket.emit("open");

			tunnel.stop();
			jest.advanceTimersByTime(60_000);

			expect(socket.ping).not.toHaveBeenCalled();
		});
	});

	describe("status", () => {
		it("returns a copy", () => {
			const { tunnel } = setup();

			const status = tunnel.status();
			status.connected = true;

			expect(tunnel.status().connected).toBe(false);
		});
	});

	describe("forwarding requests", () => {
		const connected = (opts: Parameters<typeof setup>[0] = {}) => {
			const context = setup(opts);
			context.tunnel.start(ENROLLMENT);
			const socket = context.latest();
			socket.emit("open");
			return { ...context, socket };
		};

		it("forwards a GET without a body to the local API", async () => {
			const { socket, got } = connected();

			await deliver(socket, request());

			expect(got).toHaveBeenCalledTimes(1);
			const [url, options] = got.mock.calls[0] as [URL, any];
			expect(url.toString()).toBe("http://127.0.0.1:52345/api/v1/monitors?page=1");
			expect(options).toMatchObject({
				method: "GET",
				body: undefined,
				responseType: "buffer",
				followRedirect: false,
				throwHttpErrors: false,
				retry: { limit: 0 },
				timeout: { request: 55_000 },
			});
		});

		it("forwards a POST with its decoded body", async () => {
			const { socket, got } = connected();

			await deliver(socket, request({ method: "POST", path: "/api/v1/monitors", body: Buffer.from('{"name":"x"}').toString("base64") }));

			const [, options] = got.mock.calls[0] as [URL, any];
			expect(options.method).toBe("POST");
			expect(Buffer.from(options.body).toString()).toBe('{"name":"x"}');
		});

		it("drops host and hop-by-hop headers and lower-cases the rest", async () => {
			const { socket, got } = connected();

			await deliver(
				socket,
				request({
					headers: {
						Host: "abc.checkmateconnect.io",
						Connection: "keep-alive",
						"Proxy-Authorization": "Basic x",
						"Transfer-Encoding": "chunked",
						Authorization: "Bearer jwt",
						"X-Number": 5,
					},
				})
			);

			const [, options] = got.mock.calls[0] as [URL, any];
			expect(options.headers).toEqual({ authorization: "Bearer jwt", "x-checkmate-connect-tunnel": "1" });
		});

		it("marks every forwarded request as tunneled, overwriting a value from the relay", async () => {
			const { socket, got } = connected();

			await deliver(socket, request({ headers: { "X-Checkmate-Connect-Tunnel": "0" } }));

			const [, options] = got.mock.calls[0] as [URL, any];
			expect(options.headers).toEqual({ "x-checkmate-connect-tunnel": "1" });
		});

		it("replies with the local response under the same id", async () => {
			const got = jest.fn<any>().mockResolvedValue({
				statusCode: 201,
				headers: {
					"content-type": "application/json",
					"content-encoding": "gzip",
					"transfer-encoding": "chunked",
					"set-cookie": ["a=1", "b=2"],
				},
				body: Buffer.from('{"ok":true}'),
			});
			const { socket } = connected({ got });

			await deliver(socket, request());

			expect(replies(socket)).toHaveLength(1);
			const [reply] = replies(socket);
			expect(reply).toMatchObject({ type: "response", id: "req-1", status: 201 });
			expect(reply.headers).toEqual({ "content-type": "application/json", "set-cookie": "a=1, b=2" });
			expect(decode(reply.body)).toBe('{"ok":true}');
		});

		it("replies with a null body when the local response is empty", async () => {
			const { socket } = connected({ got: jest.fn<any>().mockResolvedValue({ statusCode: 204, headers: {}, body: Buffer.alloc(0) }) });

			await deliver(socket, request());

			expect(replies(socket)[0]).toMatchObject({ status: 204, body: null });
		});

		it("passes local error statuses through", async () => {
			const { socket } = connected({ got: jest.fn<any>().mockResolvedValue({ statusCode: 401, headers: {}, body: Buffer.from("no") }) });

			await deliver(socket, request());

			expect(replies(socket)[0].status).toBe(401);
		});

		it.each([
			["a path without a leading slash", { path: "api/v1/monitors" }],
			["a protocol-relative path", { path: "//evil.com/x" }],
			["a backslash path that resolves off the local origin", { path: "/\\evil.com/x" }],
			["a non-string path", { path: 5 }],
			["a disallowed method", { method: "TRACE" }],
			["a missing method", { method: undefined }],
			["a non-string body", { body: 5 }],
		])("rejects %s with 400 and doesn't call the local API", async (_label, overrides) => {
			const { socket, got } = connected();

			await deliver(socket, request(overrides));

			expect(got).not.toHaveBeenCalled();
			const [reply] = replies(socket);
			expect(reply).toMatchObject({ type: "response", id: "req-1", status: 400 });
			expect(JSON.parse(decode(reply.body) ?? "")).toEqual({ error: "rejected by tunnel" });
		});

		it("forwards a request whose headers are missing or malformed with no headers", async () => {
			const { socket, got } = connected();

			await deliver(socket, request({ headers: null }));

			const [, options] = got.mock.calls[0] as [URL, any];
			expect(options.headers).toEqual({ "x-checkmate-connect-tunnel": "1" });
		});

		it("replies 502 and logs only the pathname when the local API can't be reached", async () => {
			const failure = new Error("connect ECONNREFUSED 127.0.0.1:52345");
			const { socket, logger } = connected({ got: jest.fn<any>().mockRejectedValue(failure) });

			await deliver(socket, request({ path: "/api/v1/auth/recovery?token=secret" }));

			const [reply] = replies(socket);
			expect(reply).toMatchObject({ id: "req-1", status: 502 });
			expect(JSON.parse(decode(reply.body) ?? "")).toEqual({ error: "local target unreachable" });
			expect(logger.error).toHaveBeenCalledWith(
				{ err: failure, method: "GET", path: "/api/v1/auth/recovery" },
				"Connect tunnel local request failed"
			);
			expect(JSON.stringify((logger.error as jest.Mock).mock.calls)).not.toContain("secret");
		});

		it.each([
			["non-JSON", "not json"],
			["the relay's hello", { type: "hello", instance: "relay-1" }],
			["null", "null"],
			["a request without an id", { ...request(), id: undefined }],
			["a request with a numeric id", { ...request(), id: 7 }],
			["a request with an empty id", { ...request(), id: "" }],
		])("ignores %s without replying", async (_label, message) => {
			const { socket, got } = connected();

			await deliver(socket, message);

			expect(got).not.toHaveBeenCalled();
			expect(socket.send).not.toHaveBeenCalled();
		});

		it("doesn't reply once the socket is no longer open", async () => {
			let resolve: (value: unknown) => void = () => {};
			const got = jest.fn<any>().mockReturnValue(new Promise((r) => (resolve = r)));
			const { socket } = connected({ got });

			socket.emit("message", Buffer.from(JSON.stringify(request())));
			socket.readyState = 3;
			resolve(OK_RESPONSE);
			await jest.advanceTimersByTimeAsync(0);

			expect(got).toHaveBeenCalledTimes(1);
			expect(socket.send).not.toHaveBeenCalled();
		});

		it("ignores requests arriving on a replaced socket", async () => {
			const { tunnel, socket, got } = connected();
			tunnel.start(ENROLLMENT);

			await deliver(socket, request());

			expect(got).not.toHaveBeenCalled();
		});
	});
});
