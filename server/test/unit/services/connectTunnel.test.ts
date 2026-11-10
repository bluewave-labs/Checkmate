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

const setup = (opts: { failConstructions?: number } = {}) => {
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
	const tunnel = new ConnectTunnel(FakeSocket as any, {} as any, {} as any, logger as any);
	const latest = () => sockets[sockets.length - 1];
	return { tunnel, sockets, latest, logger };
};

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
});
