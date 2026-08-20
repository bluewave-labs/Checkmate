import { describe, expect, it, jest } from "@jest/globals";
import { testStatusProviderContract } from "../../../helpers/statusProviderContract.ts";
import { NETWORK_ERROR } from "../../../../src/types/network.ts";
import type { Monitor } from "../../../../src/domain/monitors/monitor.type.ts";

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.unstable_mockModule("cacheable-lookup", () => ({
	default: jest.fn().mockImplementation(() => ({})),
}));

const mockGot = jest.fn();
// got instance returned by got.extend()
mockGot.mockImplementation(() => Promise.resolve());
(mockGot as any).extend = jest.fn().mockReturnValue(mockGot);

jest.unstable_mockModule("got", () => ({
	type: { Got: {} },
	HTTPError: class HTTPError extends Error {
		response: any;
		timings: any;
		constructor(msg: string, response?: any, timings?: any) {
			super(msg);
			this.name = "HTTPError";
			this.response = response;
			this.timings = timings;
		}
	},
	RequestError: class RequestError extends Error {
		response: any;
		timings: any;
		constructor(msg: string, response?: any, timings?: any) {
			super(msg);
			this.name = "RequestError";
			this.response = response;
			this.timings = timings;
		}
	},
}));

const { HttpProvider } = await import("../../../../src/service/network/HttpProvider.ts");
const gotModule = await import("got");
const { HTTPError, RequestError } = gotModule;

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "mon-1",
		teamId: "team-1",
		type: "http",
		url: "https://example.com",
		secret: undefined,
		jsonPath: undefined,
		ignoreTlsErrors: false,
		useAdvancedMatching: false,
		matchMethod: undefined,
		expectedValue: undefined,
		customUpCodes: [],
		...overrides,
	}) as Monitor;

const createMockMatcher = (result?: { ok: boolean; message: string; extracted?: unknown }) => ({
	validate: jest.fn().mockReturnValue(result ?? { ok: true, message: "Success" }),
});

const makeGotResponse = (overrides?: Record<string, any>) => ({
	ok: true,
	statusCode: 200,
	statusMessage: "OK",
	headers: { "content-type": "text/html" },
	body: "<html></html>",
	timings: { phases: { firstByte: 100, total: 120 } },
	...overrides,
});

const createProvider = (matcher?: any, proxyMonitorTypes?: string) => {
	const advancedMatcher = matcher ?? createMockMatcher();
	const provider = new HttpProvider(mockGot as any, advancedMatcher, proxyMonitorTypes);
	return { provider, advancedMatcher };
};

// ── Contract ─────────────────────────────────────────────────────────────────

testStatusProviderContract("HttpProvider", {
	create: () => {
		mockGot.mockResolvedValue(makeGotResponse());
		return createProvider().provider;
	},
	supportedType: "http",
	unsupportedType: "ping",
	makeMonitor: () => makeMonitor(),
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("HttpProvider", () => {
	// ── Success paths ────────────────────────────────────────────────────

	describe("success responses", () => {
		it("returns success for a standard HTML response", async () => {
			mockGot.mockResolvedValue(makeGotResponse());
			const { provider } = createProvider();

			const result = await provider.handle(makeMonitor());

			expect(result).toEqual(
				expect.objectContaining({
					monitorId: "mon-1",
					teamId: "team-1",
					type: "http",
					status: true,
					code: 200,
					message: "OK",
					responseTime: 120,
				})
			);
		});

		it("parses JSON body when content-type is application/json", async () => {
			mockGot.mockResolvedValue(
				makeGotResponse({
					headers: { "content-type": "application/json" },
					body: '{"status":"ok"}',
				})
			);
			const { provider } = createProvider();

			const result = await provider.handle(makeMonitor());

			expect(result.payload).toEqual({ status: "ok" });
		});

		it("returns raw body when JSON parsing fails", async () => {
			mockGot.mockResolvedValue(
				makeGotResponse({
					headers: { "content-type": "application/json" },
					body: "not-json",
				})
			);
			const { provider } = createProvider();

			const result = await provider.handle(makeMonitor());

			expect(result.payload).toBe("not-json");
		});

		it("returns raw body for non-JSON content", async () => {
			mockGot.mockResolvedValue(makeGotResponse({ body: "<html>test</html>" }));
			const { provider } = createProvider();

			const result = await provider.handle(makeMonitor());

			expect(result.payload).toBe("<html>test</html>");
		});

		it("passes Authorization header when secret is set", async () => {
			mockGot.mockResolvedValue(makeGotResponse());
			const { provider } = createProvider();

			await provider.handle(makeMonitor({ secret: "my-token" }));

			expect(mockGot).toHaveBeenCalledWith(
				"https://example.com",
				expect.objectContaining({
					headers: { Authorization: "Bearer my-token" },
				})
			);
		});

		it("passes undefined headers when no secret", async () => {
			mockGot.mockResolvedValue(makeGotResponse());
			const { provider } = createProvider();

			await provider.handle(makeMonitor({ secret: undefined }));

			expect(mockGot).toHaveBeenCalledWith(
				"https://example.com",
				expect.objectContaining({
					headers: undefined,
				})
			);
		});

		it("defaults responseTime to 0 when timings.phases.total is undefined", async () => {
			mockGot.mockResolvedValue(makeGotResponse({ timings: { phases: { total: undefined } } }));
			const { provider } = createProvider();

			const result = await provider.handle(makeMonitor());

			expect(result.responseTime).toBe(0);
		});

		it("defaults statusMessage to 'OK' when undefined", async () => {
			mockGot.mockResolvedValue(makeGotResponse({ statusMessage: undefined }));
			const { provider } = createProvider();

			const result = await provider.handle(makeMonitor());

			expect(result.message).toBe("OK");
		});

		it("uses empty string for content-type when header is missing", async () => {
			mockGot.mockResolvedValue(makeGotResponse({ headers: {} }));
			const { provider } = createProvider();

			const result = await provider.handle(makeMonitor());

			// Should treat as non-JSON
			expect(result.payload).toBe("<html></html>");
		});
	});

	// ── jsonPath + non-JSON response ─────────────────────────────────────

	describe("jsonPath validation", () => {
		it("returns failure when jsonPath is set but response is not JSON", async () => {
			mockGot.mockResolvedValue(makeGotResponse({ headers: { "content-type": "text/html" } }));
			const { provider } = createProvider();

			const result = await provider.handle(makeMonitor({ jsonPath: "status" }));

			expect(result.status).toBe(false);
			expect(result.message).toBe("Response is not JSON");
		});

		it("defaults responseTime to 0 in non-JSON jsonPath response when total is undefined", async () => {
			mockGot.mockResolvedValue(
				makeGotResponse({
					headers: { "content-type": "text/html" },
					timings: { phases: { total: undefined } },
				})
			);
			const { provider } = createProvider();

			const result = await provider.handle(makeMonitor({ jsonPath: "status" }));

			expect(result.responseTime).toBe(0);
		});
	});

	// ── AdvancedMatcher integration ──────────────────────────────────────

	describe("advanced matching", () => {
		it("uses matcher result for status and message", async () => {
			mockGot.mockResolvedValue(makeGotResponse());
			const matcher = createMockMatcher({ ok: false, message: "Mismatch", extracted: "value" });
			const { provider } = createProvider(matcher);

			const result = await provider.handle(makeMonitor({ useAdvancedMatching: true }));

			expect(result.status).toBe(false);
			expect(result.message).toBe("Mismatch");
			expect(result.extracted).toBe("value");
		});

		it("sets status to false when status code is non-2xx even if matcher passes", async () => {
			mockGot.mockResolvedValue(makeGotResponse({ ok: false, statusCode: 301 }));
			const matcher = createMockMatcher({ ok: true, message: "Success" });
			const { provider } = createProvider(matcher);

			const result = await provider.handle(makeMonitor());

			expect(result.status).toBe(false);
		});
	});

	// ── Error handling ───────────────────────────────────────────────────

	describe("error handling", () => {
		it("handles HTTPError with response and timings", async () => {
			const err = new HTTPError("Not Found");
			(err as any).response = { statusCode: 404 };
			(err as any).timings = { phases: { total: 50 } };
			mockGot.mockRejectedValue(err);
			const { provider } = createProvider();

			const result = await provider.handle(makeMonitor());

			expect(result).toEqual(
				expect.objectContaining({
					status: false,
					code: 404,
					message: "Not Found",
					responseTime: 50,
				})
			);
		});

		it("handles RequestError with response and timings", async () => {
			const err = new RequestError("ECONNREFUSED");
			(err as any).response = { statusCode: undefined };
			(err as any).timings = { phases: { total: undefined } };
			mockGot.mockRejectedValue(err);
			const { provider } = createProvider();

			const result = await provider.handle(makeMonitor());

			expect(result.code).toBe(NETWORK_ERROR);
			expect(result.responseTime).toBe(0);
		});

		it("handles HTTPError without response (defaults to NETWORK_ERROR)", async () => {
			const err = new HTTPError("Timeout");
			(err as any).response = undefined;
			(err as any).timings = undefined;
			mockGot.mockRejectedValue(err);
			const { provider } = createProvider();

			const result = await provider.handle(makeMonitor());

			expect(result.code).toBe(NETWORK_ERROR);
			expect(result.responseTime).toBe(0);
		});

		it("handles generic Error (non-HTTPError/RequestError)", async () => {
			mockGot.mockRejectedValue(new Error("DNS lookup failed"));
			const { provider } = createProvider();

			const result = await provider.handle(makeMonitor());

			expect(result).toEqual(
				expect.objectContaining({
					status: false,
					code: NETWORK_ERROR,
					message: "DNS lookup failed",
					responseTime: 0,
				})
			);
		});

		it("handles non-Error thrown values", async () => {
			mockGot.mockRejectedValue("string error");
			const { provider } = createProvider();

			const result = await provider.handle(makeMonitor());

			expect(result.message).toBe("string error");
			expect(result.code).toBe(NETWORK_ERROR);
		});

		it("throws when url is missing", async () => {
			const { provider } = createProvider();

			await expect(provider.handle(makeMonitor({ url: "" }))).rejects.toThrow("URL is required for HTTP monitor");
		});
	});

	// ── customUpCodes ────────────────────────────────────────────────────

	describe("customUpCodes", () => {
		it("returns status true when HTTPError status code is in customUpCodes", async () => {
			const err = new HTTPError("Unauthorized");
			(err as any).response = { statusCode: 401 };
			(err as any).timings = { phases: { total: 30 } };
			mockGot.mockRejectedValue(err);
			const { provider } = createProvider();

			const result = await provider.handle(makeMonitor({ customUpCodes: [401] }));

			expect(result.status).toBe(true);
			expect(result.code).toBe(401);
		});

		it("returns status false when HTTPError status code is not in customUpCodes", async () => {
			const err = new HTTPError("Internal Server Error");
			(err as any).response = { statusCode: 500 };
			(err as any).timings = { phases: { total: 40 } };
			mockGot.mockRejectedValue(err);
			const { provider } = createProvider();

			const result = await provider.handle(makeMonitor({ customUpCodes: [401, 403] }));

			expect(result.status).toBe(false);
			expect(result.code).toBe(500);
		});

		it("returns status false when customUpCodes is empty", async () => {
			const err = new HTTPError("Unauthorized");
			(err as any).response = { statusCode: 401 };
			(err as any).timings = { phases: { total: 25 } };
			mockGot.mockRejectedValue(err);
			const { provider } = createProvider();

			const result = await provider.handle(makeMonitor({ customUpCodes: [] }));

			expect(result.status).toBe(false);
			expect(result.code).toBe(401);
		});

		it("treats non-2xx success response as up when status code is in customUpCodes", async () => {
			mockGot.mockResolvedValue(makeGotResponse({ ok: false, statusCode: 301, statusMessage: "Moved Permanently" }));
			const { provider } = createProvider();

			const result = await provider.handle(makeMonitor({ customUpCodes: [301] }));

			expect(result.status).toBe(true);
			expect(result.code).toBe(301);
		});

		it("does not override matcher failure even when status code is in customUpCodes", async () => {
			mockGot.mockResolvedValue(makeGotResponse({ ok: false, statusCode: 301 }));
			const matcher = createMockMatcher({ ok: false, message: "Body mismatch" });
			const { provider } = createProvider(matcher);

			const result = await provider.handle(makeMonitor({ customUpCodes: [301] }));

			expect(result.status).toBe(false);
			expect(result.message).toBe("Body mismatch");
		});

		it("does not override matcher failure on HTTPError when status code is in customUpCodes", async () => {
			const err = new HTTPError("Unauthorized");
			(err as any).response = {
				statusCode: 401,
				body: '{"status":"down"}',
				headers: { "content-type": "application/json" },
			};
			(err as any).timings = { phases: { total: 30 } };
			mockGot.mockRejectedValue(err);
			const matcher = createMockMatcher({
				ok: false,
				message: "Body mismatch",
				extracted: "down",
			});
			const { provider } = createProvider(matcher);

			const result = await provider.handle(makeMonitor({ customUpCodes: [401], useAdvancedMatching: true }));

			expect(result.status).toBe(false);
			expect(result.message).toBe("Body mismatch");
			expect(result.payload).toEqual({ status: "down" });
			expect(result.extracted).toBe("down");
		});
	});

	// ── HTTP method (GET / HEAD) ─────────────────────────────────────────

	describe("request method", () => {
		it("passes GET to got when method is GET", async () => {
			mockGot.mockResolvedValue(makeGotResponse());
			const { provider } = createProvider();

			await provider.handle(makeMonitor({ method: "GET" }));

			expect(mockGot).toHaveBeenCalledWith("https://example.com", expect.objectContaining({ method: "GET" }));
		});

		it("passes HEAD to got when method is HEAD", async () => {
			mockGot.mockResolvedValue(makeGotResponse({ body: "" }));
			const { provider } = createProvider();

			await provider.handle(makeMonitor({ method: "HEAD" }));

			expect(mockGot).toHaveBeenCalledWith("https://example.com", expect.objectContaining({ method: "HEAD" }));
		});

		it("does not mark a HEAD monitor down on an empty body even with advanced matching on", async () => {
			mockGot.mockResolvedValue(makeGotResponse({ body: "", headers: {} }));
			// A matcher that would fail — proving HEAD never reaches it
			const matcher = createMockMatcher({ ok: false, message: "Extracted value is falsy" });
			const { provider, advancedMatcher } = createProvider(matcher);

			const result = await provider.handle(makeMonitor({ method: "HEAD", useAdvancedMatching: true, jsonPath: "status" }));

			expect(result.status).toBe(true);
			expect(advancedMatcher.validate).not.toHaveBeenCalled();
		});

		it("bases HEAD status on the status code (down when not an up code)", async () => {
			const err = new HTTPError("Internal Server Error");
			(err as any).response = { statusCode: 500, body: "", headers: {} };
			(err as any).timings = { phases: { total: 40 } };
			mockGot.mockRejectedValue(err);
			const { provider } = createProvider();

			const result = await provider.handle(makeMonitor({ method: "HEAD" }));

			expect(result.status).toBe(false);
			expect(result.code).toBe(500);
		});

		it("respects customUpCodes for HEAD requests without consulting the matcher", async () => {
			const err = new HTTPError("Unauthorized");
			(err as any).response = { statusCode: 401, body: "", headers: {} };
			(err as any).timings = { phases: { total: 30 } };
			mockGot.mockRejectedValue(err);
			const { provider, advancedMatcher } = createProvider();

			const result = await provider.handle(makeMonitor({ method: "HEAD", customUpCodes: [401], useAdvancedMatching: true }));

			expect(result.status).toBe(true);
			expect(result.code).toBe(401);
			expect(advancedMatcher.validate).not.toHaveBeenCalled();
		});
	});

	// ── Outbound proxy ───────────────────────────────────────────────────

	describe("outbound proxy routing", () => {
		const PROXY_KEYS = ["HTTP_PROXY", "HTTPS_PROXY", "NO_PROXY", "http_proxy", "https_proxy", "no_proxy"];
		const clearProxyEnv = () => {
			for (const key of PROXY_KEYS) delete process.env[key];
		};

		const agentOf = () => (mockGot.mock.calls[0]?.[1] as any)?.agent;
		const httpsOptionOf = () => (mockGot.mock.calls[0]?.[1] as any)?.https;
		const isProxyAgent = (agent: any) => Boolean(agent?.https?.constructor?.name?.includes("Proxy"));

		it("routes an http monitor through the configured proxy", async () => {
			clearProxyEnv();
			process.env.HTTPS_PROXY = "http://corp:3128";
			mockGot.mockResolvedValue(makeGotResponse());
			const { provider } = createProvider();

			await provider.handle(makeMonitor({ url: "https://example.com" }));

			expect(isProxyAgent(agentOf())).toBe(true);
			clearProxyEnv();
		});

		it("leaves infrastructure monitors direct by default", async () => {
			clearProxyEnv();
			process.env.HTTPS_PROXY = "http://corp:3128";
			mockGot.mockResolvedValue(makeGotResponse());
			const { provider } = createProvider();

			// Capture agents live on the internal network; proxying them breaks them.
			await provider.handle(makeMonitor({ type: "hardware", url: "https://10.0.0.5:59232" }));

			expect(isProxyAgent(agentOf())).toBe(false);
			clearProxyEnv();
		});

		it("routes infrastructure monitors once opted in", async () => {
			clearProxyEnv();
			process.env.HTTPS_PROXY = "http://corp:3128";
			mockGot.mockResolvedValue(makeGotResponse());
			const { provider } = createProvider(undefined, "http,hardware");

			await provider.handle(makeMonitor({ type: "hardware", url: "https://10.0.0.5:59232" }));

			expect(isProxyAgent(agentOf())).toBe(true);
			clearProxyEnv();
		});

		it("keeps ignoreTlsErrors effective for proxied monitors", async () => {
			clearProxyEnv();
			process.env.HTTPS_PROXY = "http://corp:3128";
			mockGot.mockResolvedValue(makeGotResponse());
			const { provider } = createProvider();

			// The proxy agent's rejectUnauthorized applies to the socket to the proxy,
			// not the tunnelled handshake, so this must be stated per request or a
			// self-signed target would start failing the moment a proxy is configured.
			await provider.handle(makeMonitor({ url: "https://self-signed.example.com", ignoreTlsErrors: true }));

			expect(httpsOptionOf()).toEqual({ rejectUnauthorized: false });
			clearProxyEnv();
		});

		it("keeps TLS strict for proxied monitors that did not opt out", async () => {
			clearProxyEnv();
			process.env.HTTPS_PROXY = "http://corp:3128";
			mockGot.mockResolvedValue(makeGotResponse());
			const { provider } = createProvider();

			await provider.handle(makeMonitor({ url: "https://example.com", ignoreTlsErrors: false }));

			expect(httpsOptionOf()).toEqual({ rejectUnauthorized: true });
			clearProxyEnv();
		});

		it("does not set a proxy agent when no proxy is configured", async () => {
			clearProxyEnv();
			mockGot.mockResolvedValue(makeGotResponse());
			const { provider } = createProvider();

			await provider.handle(makeMonitor({ url: "https://example.com" }));

			expect(isProxyAgent(agentOf())).toBe(false);
		});

		it("reports a refused proxy tunnel as a network error, not the target's status", async () => {
			clearProxyEnv();
			process.env.HTTPS_PROXY = "http://corp:3128";
			const { provider } = createProvider();
			// The agent replays a refused CONNECT onto the socket, so the proxy's own
			// status would otherwise be parsed as the target's.
			const agent: any = (provider as any).proxyAgents.get("http://corp:3128", "https://example.com");
			const err = new HTTPError("Response code 403 (Forbidden)");
			(err as any).response = { statusCode: 403, body: "", headers: {} };
			(err as any).timings = { phases: { total: 5 } };
			mockGot.mockImplementation(() => {
				agent.emit("proxyConnect", { statusCode: 403 });
				return Promise.reject(err);
			});

			const result = await provider.handle(makeMonitor({ url: "https://example.com", customUpCodes: [403] }));

			// customUpCodes must not mark the monitor up on the proxy's status.
			expect(result.status).toBe(false);
			expect(result.code).toBe(NETWORK_ERROR);
			expect(result.message).toContain("Proxy refused");
			clearProxyEnv();
		});

		it("honours NO_PROXY", async () => {
			clearProxyEnv();
			process.env.HTTPS_PROXY = "http://corp:3128";
			process.env.NO_PROXY = "example.com";
			mockGot.mockResolvedValue(makeGotResponse());
			const { provider } = createProvider();

			await provider.handle(makeMonitor({ url: "https://example.com" }));

			expect(isProxyAgent(agentOf())).toBe(false);
			clearProxyEnv();
		});
	});
});
