import { describe, expect, it, jest } from "@jest/globals";
import { testStatusProviderContract } from "../../helpers/statusProviderContract.ts";
import { NETWORK_ERROR } from "../../../src/service/infrastructure/network/utils.ts";
import type { Monitor } from "../../../src/types/index.ts";

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

const { HttpProvider } = await import("../../../src/service/infrastructure/network/HttpProvider.ts");
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
	timings: { phases: { total: 100 } },
	...overrides,
});

const createProvider = (matcher?: any) => {
	const advancedMatcher = matcher ?? createMockMatcher();
	const provider = new HttpProvider(mockGot as any, advancedMatcher);
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
					responseTime: 100,
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

		it("sets status to false when response.ok is false even if matcher passes", async () => {
			mockGot.mockResolvedValue(makeGotResponse({ ok: false, statusCode: 301 }));
			const matcher = createMockMatcher({ ok: true, message: "Success" });
			const { provider } = createProvider(matcher);

			const result = await provider.handle(makeMonitor());

			// status = response.ok && matchResult.ok
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
});
