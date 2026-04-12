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

const createService = () => {
	const logger = createMockLogger();
	const service = new GlobalPingService(logger as any);
	return { service, logger };
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

		it("logs stack as undefined for non-Error thrown values", async () => {
			const { service, logger } = createService();
			mockGotPost.mockRejectedValue("string error");

			await service.createMeasurement("http", "https://example.com", ["NA"] as GeoContinent[]);

			expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ stack: undefined }));
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

		it("logs stack as undefined for non-Error thrown values in poll", async () => {
			const { service, logger } = createService();
			mockGotGet.mockRejectedValue(42);

			await service.pollForResults("meas-123");

			expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ stack: undefined }));
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
});
