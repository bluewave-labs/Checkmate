import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import type { GeoContinent } from "../../../src/types/geoCheck.ts";

// ── got mock ─────────────────────────────────────────────────────────────────

const mockGotPost = jest.fn();
const mockGotGet = jest.fn();

jest.unstable_mockModule("got", () => ({
	default: {
		post: mockGotPost,
		get: mockGotGet,
	},
}));

// Dynamic import AFTER mock registration
const { GlobalPingService } = await import("../../../src/service/infrastructure/globalPingService.ts");

// ── Helpers ──────────────────────────────────────────────────────────────────

const createService = (token?: string) => {
	const logger = createMockLogger();
	const settingsService = {
		getGlobalpingApiToken: jest.fn(async () => token),
	};
	const service = new GlobalPingService(logger as any, settingsService as any);
	return { service, logger, settingsService };
};

const makeProbeResult = (overrides?: Record<string, any>) => ({
	probe: {
		continent: "NA" as GeoContinent,
		region: "Northern America",
		country: "US",
		state: "CA",
		city: "San Francisco",
		longitude: -122.4,
		latitude: 37.77,
	},
	result: {
		status: "finished",
		statusCode: 200,
		statusCodeName: "OK",
		timings: {
			total: 150,
			dns: 10,
			tcp: 20,
			tls: 30,
			firstByte: 50,
			download: 40,
		},
	},
	...overrides,
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("GlobalPingService", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockGotPost.mockReset();
		mockGotGet.mockReset();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	// ── Static / instance properties ─────────────────────────────────────

	describe("serviceName", () => {
		it("returns GlobalPingService from static property", () => {
			expect(GlobalPingService.SERVICE_NAME).toBe("GlobalPingService");
		});

		it("returns GlobalPingService from instance getter", () => {
			const { service } = createService();
			expect(service.serviceName).toBe("GlobalPingService");
		});
	});

	// ── createMeasurement ────────────────────────────────────────────────

	describe("createMeasurement", () => {
		it("creates a measurement and returns the id", async () => {
			const { service, logger } = createService();
			mockGotPost.mockResolvedValue({ body: { id: "meas-123" } });

			const result = await service.createMeasurement("http", "https://example.com", ["NA", "EU"] as GeoContinent[]);

			expect(result).toBe("meas-123");
			expect(mockGotPost).toHaveBeenCalledWith(
				"https://api.globalping.io/v1/measurements",
				expect.objectContaining({
					json: {
						type: "http",
						target: "example.com",
						locations: [{ continent: "NA" }, { continent: "EU" }],
						limit: 2,
					},
					responseType: "json",
					timeout: { request: 10000 },
				})
			);
			expect(logger.debug).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining("meas-123"),
					method: "createMeasurement",
				})
			);
		});

		it("strips http:// protocol from target URL", async () => {
			const { service } = createService();
			mockGotPost.mockResolvedValue({ body: { id: "meas-1" } });

			await service.createMeasurement("http", "http://example.com", ["NA"] as GeoContinent[]);

			expect(mockGotPost).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					json: expect.objectContaining({ target: "example.com" }),
				})
			);
		});

		it("strips https:// protocol from target URL", async () => {
			const { service } = createService();
			mockGotPost.mockResolvedValue({ body: { id: "meas-1" } });

			await service.createMeasurement("http", "https://example.com/path", ["EU"] as GeoContinent[]);

			expect(mockGotPost).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					json: expect.objectContaining({ target: "example.com/path" }),
				})
			);
		});

		it("returns null and logs error for unsupported monitor type", async () => {
			const { service, logger } = createService();

			const result = await service.createMeasurement("hardware" as any, "https://example.com", ["NA"] as GeoContinent[]);

			expect(result).toBeNull();
			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "GlobalPing API unavailable, skipping geo check",
					method: "createMeasurement",
				})
			);
		});

		it("returns null and logs error when API call fails", async () => {
			const { service, logger } = createService();
			mockGotPost.mockRejectedValue(new Error("Network error"));

			const result = await service.createMeasurement("http", "https://example.com", ["NA"] as GeoContinent[]);

			expect(result).toBeNull();
			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "GlobalPing API unavailable, skipping geo check",
					method: "createMeasurement",
				})
			);
		});

		it("logs redacted error details for non-Error thrown values", async () => {
			const { service, logger } = createService();
			mockGotPost.mockRejectedValue("string error");

			await service.createMeasurement("http", "https://example.com", ["NA"] as GeoContinent[]);

			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					method: "createMeasurement",
					details: { error: "Unknown error" },
				})
			);
		});

		it("supports ping monitor type", async () => {
			const { service } = createService();
			mockGotPost.mockResolvedValue({ body: { id: "meas-ping" } });

			const result = await service.createMeasurement("ping", "example.com", ["NA"] as GeoContinent[]);

			expect(result).toBe("meas-ping");
		});
	});

	// ── pollForResults ───────────────────────────────────────────────────

	describe("pollForResults", () => {
		it("returns transformed results when measurement is finished", async () => {
			const { service, logger } = createService();
			mockGotGet.mockResolvedValue({
				body: {
					status: "finished",
					results: [makeProbeResult()],
				},
			});

			const results = await service.pollForResults("meas-123");

			expect(results).toHaveLength(1);
			expect(results[0]).toEqual(
				expect.objectContaining({
					location: expect.objectContaining({
						continent: "NA",
						city: "San Francisco",
					}),
					status: true,
					statusCode: 200,
					timings: expect.objectContaining({
						total: 150,
						dns: 10,
					}),
				})
			);
			expect(logger.debug).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining("meas-123"),
					method: "pollForResults",
				})
			);
		});

		it("defaults results to empty array when finished with no results", async () => {
			const { service } = createService();
			mockGotGet.mockResolvedValue({
				body: { status: "finished", results: undefined },
			});

			const results = await service.pollForResults("meas-123");

			expect(results).toEqual([]);
		});

		it("returns empty array when measurement has failed", async () => {
			const { service, logger } = createService();
			mockGotGet.mockResolvedValue({
				body: { status: "failed" },
			});

			const results = await service.pollForResults("meas-123");

			expect(results).toEqual([]);
			expect(logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining("failed"),
					method: "pollForResults",
				})
			);
		});

		it("polls again when status is in-progress, then returns on finished", async () => {
			const { service } = createService();
			mockGotGet.mockResolvedValueOnce({ body: { status: "in-progress" } }).mockResolvedValueOnce({
				body: {
					status: "finished",
					results: [makeProbeResult()],
				},
			});

			const promise = service.pollForResults("meas-123");

			// Advance past the sleep(2000)
			await jest.advanceTimersByTimeAsync(2000);

			const results = await promise;

			expect(mockGotGet).toHaveBeenCalledTimes(2);
			expect(results).toHaveLength(1);
		});

		it("returns empty array and logs error when API call throws", async () => {
			const { service, logger } = createService();
			mockGotGet.mockRejectedValue(new Error("Connection refused"));

			const results = await service.pollForResults("meas-123");

			expect(results).toEqual([]);
			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Error polling GlobalPing API",
					method: "pollForResults",
				})
			);
		});

		it("logs redacted error details for non-Error thrown values in poll", async () => {
			const { service, logger } = createService();
			mockGotGet.mockRejectedValue("string error");

			await service.pollForResults("meas-123");

			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					method: "pollForResults",
					details: { error: "Unknown error" },
				})
			);
		});

		it("returns empty array and logs warning on timeout", async () => {
			const { service, logger } = createService();
			// Always return in-progress so we hit the timeout
			mockGotGet.mockImplementation(async () => ({ body: { status: "in-progress" } }));

			const promise = service.pollForResults("meas-123", 100);

			// Advance time well past the timeout
			await jest.advanceTimersByTimeAsync(35000);

			const results = await promise;

			expect(results).toEqual([]);
			expect(logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining("timeout"),
					method: "pollForResults",
					details: expect.objectContaining({ measurementId: "meas-123", timeoutMs: 100 }),
				})
			);
		});
	});

	// ── transformResults (via pollForResults) ────────────────────────────

	describe("transformResults", () => {
		it("skips probes with non-finished status", async () => {
			const { service } = createService();
			mockGotGet.mockResolvedValue({
				body: {
					status: "finished",
					results: [makeProbeResult({ result: { status: "failed" } }), makeProbeResult({ result: { status: "timeout" } })],
				},
			});

			const results = await service.pollForResults("meas-123");

			expect(results).toEqual([]);
		});

		it("transforms HTTP results with statusCode and timings", async () => {
			const { service } = createService();
			mockGotGet.mockResolvedValue({
				body: {
					status: "finished",
					results: [makeProbeResult()],
				},
			});

			const results = await service.pollForResults("meas-123");

			expect(results[0].status).toBe(true);
			expect(results[0].statusCode).toBe(200);
			expect(results[0].timings.total).toBe(150);
		});

		it("marks HTTP result as failed for non-2xx status codes", async () => {
			const { service } = createService();
			mockGotGet.mockResolvedValue({
				body: {
					status: "finished",
					results: [
						makeProbeResult({
							result: {
								status: "finished",
								statusCode: 500,
								timings: { total: 100, dns: 5, tcp: 10, tls: 15, firstByte: 30, download: 40 },
							},
						}),
					],
				},
			});

			const results = await service.pollForResults("meas-123");

			expect(results[0].status).toBe(false);
			expect(results[0].statusCode).toBe(500);
		});

		it("transforms ping results with stats (no loss)", async () => {
			const { service } = createService();
			mockGotGet.mockResolvedValue({
				body: {
					status: "finished",
					results: [
						makeProbeResult({
							result: {
								status: "finished",
								stats: { min: 10, max: 30, avg: 20, total: 3, loss: 0, rcv: 3, drop: 0 },
							},
						}),
					],
				},
			});

			const results = await service.pollForResults("meas-123");

			expect(results[0].status).toBe(true);
			expect(results[0].statusCode).toBe(200);
			expect(results[0].timings.total).toBe(20);
			expect(results[0].timings.dns).toBe(0);
		});

		it("transforms ping results with loss as failed", async () => {
			const { service } = createService();
			mockGotGet.mockResolvedValue({
				body: {
					status: "finished",
					results: [
						makeProbeResult({
							result: {
								status: "finished",
								stats: { min: 10, max: 30, avg: 20, total: 3, loss: 2, rcv: 1, drop: 2 },
							},
						}),
					],
				},
			});

			const results = await service.pollForResults("meas-123");

			expect(results[0].status).toBe(false);
			expect(results[0].statusCode).toBe(5000);
		});

		it("uses empty string for null state in location", async () => {
			const { service } = createService();
			mockGotGet.mockResolvedValue({
				body: {
					status: "finished",
					results: [
						makeProbeResult({
							probe: {
								continent: "EU",
								region: "Western Europe",
								country: "DE",
								state: null,
								city: "Berlin",
								longitude: 13.4,
								latitude: 52.5,
							},
						}),
					],
				},
			});

			const results = await service.pollForResults("meas-123");

			expect(results[0].location.state).toBe("");
		});

		it("skips probes with no statusCode/timings and no stats", async () => {
			const { service } = createService();
			mockGotGet.mockResolvedValue({
				body: {
					status: "finished",
					results: [
						makeProbeResult({
							result: { status: "finished" },
						}),
					],
				},
			});

			const results = await service.pollForResults("meas-123");

			expect(results).toEqual([]);
		});

		it("transforms multiple probes from different locations", async () => {
			const { service } = createService();
			mockGotGet.mockResolvedValue({
				body: {
					status: "finished",
					results: [
						makeProbeResult(),
						makeProbeResult({
							probe: {
								continent: "EU",
								region: "Western Europe",
								country: "GB",
								state: null,
								city: "London",
								longitude: -0.12,
								latitude: 51.5,
							},
							result: {
								status: "finished",
								statusCode: 200,
								timings: { total: 80, dns: 5, tcp: 10, tls: 15, firstByte: 30, download: 20 },
							},
						}),
					],
				},
			});

			const results = await service.pollForResults("meas-123");

			expect(results).toHaveLength(2);
			expect(results[0].location.continent).toBe("NA");
			expect(results[1].location.continent).toBe("EU");
		});
	});

	describe("authentication", () => {
		it("sends Authorization header on createMeasurement when token is configured", async () => {
			const { service } = createService("test-token");
			mockGotPost.mockResolvedValue({ body: { id: "abc" } });

			await service.createMeasurement("http", "https://example.com", ["EU"] as GeoContinent[]);

			expect(mockGotPost).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					headers: { Authorization: "Bearer test-token" },
				})
			);
		});

		it("omits Authorization header on createMeasurement when no token is configured", async () => {
			const { service } = createService();
			mockGotPost.mockResolvedValue({ body: { id: "abc" } });

			await service.createMeasurement("http", "https://example.com", ["EU"] as GeoContinent[]);

			const call = mockGotPost.mock.calls[0][1] as { headers: Record<string, string> };
			expect(call.headers).toEqual({});
		});

		it("sends Authorization header on pollForResults when token is configured", async () => {
			const { service } = createService("poll-token");
			mockGotGet.mockResolvedValue({ body: { status: "finished", results: [] } });

			await service.pollForResults("meas-1");

			expect(mockGotGet).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					headers: { Authorization: "Bearer poll-token" },
				})
			);
		});

		it("redacts Bearer tokens from logged error messages", async () => {
			const { service, logger } = createService("secret-token");
			mockGotPost.mockRejectedValue(new Error("Request failed: Authorization: Bearer secret-token"));

			await service.createMeasurement("http", "https://example.com", ["EU"] as GeoContinent[]);

			const errorCall = (logger.error as jest.Mock).mock.calls.find(
				(args) => (args[0] as { method?: string }).method === "createMeasurement"
			);
			expect(errorCall).toBeDefined();
			const detailsError = (errorCall![0] as { details: { error: string } }).details.error;
			expect(detailsError).not.toContain("secret-token");
			expect(detailsError).toContain("***REDACTED***");
		});
	});

	describe("getQuota", () => {
		it("returns authenticated true and parsed limits when token is configured", async () => {
			const { service } = createService("real-token");
			mockGotGet.mockResolvedValue({
				body: {
					rateLimit: {
						measurements: {
							create: { limit: 500, remaining: 487 },
						},
					},
				},
			});

			const quota = await service.getQuota();

			expect(quota).toEqual({ authenticated: true, limit: 500, remaining: 487 });
			expect(mockGotGet).toHaveBeenCalledWith(
				expect.stringContaining("/limits"),
				expect.objectContaining({
					headers: { Authorization: "Bearer real-token" },
				})
			);
		});

		it("returns authenticated false when no token is configured", async () => {
			const { service } = createService();
			mockGotGet.mockResolvedValue({
				body: {
					rateLimit: {
						measurements: {
							create: { limit: 50, remaining: 50 },
						},
					},
				},
			});

			const quota = await service.getQuota();

			expect(quota).toEqual({ authenticated: false, limit: 50, remaining: 50 });
		});

		it("uses tokenOverride when provided, ignoring saved token", async () => {
			const { service } = createService("saved-token");
			mockGotGet.mockResolvedValue({
				body: { rateLimit: { measurements: { create: { limit: 500, remaining: 100 } } } },
			});

			await service.getQuota("override-token");

			expect(mockGotGet).toHaveBeenCalledWith(
				expect.stringContaining("/limits"),
				expect.objectContaining({
					headers: { Authorization: "Bearer override-token" },
				})
			);
		});

		it("defaults limit and remaining to 0 when API response is missing those fields", async () => {
			const { service } = createService();
			mockGotGet.mockResolvedValue({ body: {} });

			const quota = await service.getQuota();

			expect(quota).toEqual({ authenticated: false, limit: 0, remaining: 0 });
		});

		it("propagates errors so the caller can distinguish 401 from network errors", async () => {
			const { service } = createService("bad-token");
			const apiError = Object.assign(new Error("Unauthorized"), { response: { statusCode: 401 } });
			mockGotGet.mockRejectedValue(apiError);

			await expect(service.getQuota()).rejects.toBe(apiError);
		});
	});
});
