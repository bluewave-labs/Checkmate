import { describe, expect, it, jest } from "@jest/globals";
import { GeoChecksService } from "../../../src/service/business/geoChecksService.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import type { Monitor } from "../../../src/types/index.ts";
import type { GeoCheckResult } from "../../../src/types/geoCheck.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "mon-1",
		teamId: "team-1",
		type: "http",
		url: "https://example.com",
		geoCheckEnabled: true,
		geoCheckLocations: ["NA", "EU"],
		...overrides,
	}) as Monitor;

const makeGeoResult = (overrides?: Partial<GeoCheckResult>): GeoCheckResult => ({
	continent: "NA",
	country: "US",
	city: "New York",
	status: "up",
	responseTime: 50,
	...overrides,
});

const createService = (overrides?: Record<string, unknown>) => {
	const logger = createMockLogger();
	const geoChecksRepository = {
		createGeoChecks: jest.fn().mockResolvedValue([]),
		findByMonitorId: jest.fn().mockResolvedValue({ geoChecksCount: 0, geoChecks: [] }),
	};
	const globalPingService = {
		createMeasurement: jest.fn().mockResolvedValue("measurement-123"),
		pollForResults: jest.fn().mockResolvedValue([makeGeoResult()]),
	};
	const monitorsRepository = {
		findById: jest.fn().mockResolvedValue(makeMonitor()),
	};

	const defaults = { logger, geoChecksRepository, globalPingService, monitorsRepository, ...overrides };
	const service = new GeoChecksService(defaults as any);
	return { service, ...defaults };
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("GeoChecksService", () => {
	describe("serviceName", () => {
		it("returns GeoChecksService from static property", () => {
			expect(GeoChecksService.SERVICE_NAME).toBe("GeoChecksService");
		});

		it("returns GeoChecksService from instance getter", () => {
			const { service } = createService();
			expect(service.serviceName).toBe("GeoChecksService");
		});
	});

	// ── buildGeoCheck ───────────────────────────────────────────────────────

	describe("buildGeoCheck", () => {
		it("returns a geo check document on success", async () => {
			const { service } = createService();

			const result = await service.buildGeoCheck(makeMonitor());

			expect(result).not.toBeNull();
			expect(result!.metadata).toEqual({ monitorId: "mon-1", teamId: "team-1", type: "http" });
			expect(result!.results).toHaveLength(1);
			expect(result!.results[0].continent).toBe("NA");
			expect(result!.id).toBeDefined();
			expect(result!.expiry).toBeDefined();
		});

		it("returns null and warns when monitor has no URL", async () => {
			const { service, logger } = createService();

			const result = await service.buildGeoCheck(makeMonitor({ url: "" }));

			expect(result).toBeNull();
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: "Monitor missing URL for geo check" }));
		});

		it("returns null and warns when geoCheckLocations is empty", async () => {
			const { service, logger } = createService();

			const result = await service.buildGeoCheck(makeMonitor({ geoCheckLocations: [] }));

			expect(result).toBeNull();
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: "Monitor missing geo check locations" }));
		});

		it("returns null and warns when geoCheckLocations is undefined", async () => {
			const { service, logger } = createService();

			const result = await service.buildGeoCheck(makeMonitor({ geoCheckLocations: undefined as any }));

			expect(result).toBeNull();
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: "Monitor missing geo check locations" }));
		});

		it("returns null when createMeasurement returns null (API unavailable)", async () => {
			const { service, logger } = createService({
				globalPingService: {
					createMeasurement: jest.fn().mockResolvedValue(null),
					pollForResults: jest.fn(),
				},
			});

			const result = await service.buildGeoCheck(makeMonitor());

			expect(result).toBeNull();
			expect(logger.debug).toHaveBeenCalledWith(expect.objectContaining({ message: "Skipping geo check due to API unavailability" }));
		});

		it("returns null when pollForResults returns empty array", async () => {
			const { service, logger } = createService({
				globalPingService: {
					createMeasurement: jest.fn().mockResolvedValue("measurement-123"),
					pollForResults: jest.fn().mockResolvedValue([]),
				},
			});

			const result = await service.buildGeoCheck(makeMonitor());

			expect(result).toBeNull();
			expect(logger.debug).toHaveBeenCalledWith(expect.objectContaining({ message: "No successful geo check results" }));
		});

		it("returns null and logs error when an exception is thrown", async () => {
			const { service, logger } = createService({
				globalPingService: {
					createMeasurement: jest.fn().mockRejectedValue(new Error("API error")),
					pollForResults: jest.fn(),
				},
			});

			const result = await service.buildGeoCheck(makeMonitor());

			expect(result).toBeNull();
			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Error executing geo check",
					details: expect.objectContaining({ error: "API error" }),
				})
			);
		});

		it("logs 'Unknown error' for non-Error exceptions", async () => {
			const { service, logger } = createService({
				globalPingService: {
					createMeasurement: jest.fn().mockRejectedValue("string error"),
					pollForResults: jest.fn(),
				},
			});

			const result = await service.buildGeoCheck(makeMonitor());

			expect(result).toBeNull();
			expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ details: expect.objectContaining({ error: "Unknown error" }) }));
		});
	});

	// ── createGeoChecks ─────────────────────────────────────────────────────

	describe("createGeoChecks", () => {
		it("delegates to repository", async () => {
			const { service, geoChecksRepository } = createService();
			const geoChecks = [{ id: "gc-1" }] as any;

			await service.createGeoChecks(geoChecks);

			expect(geoChecksRepository.createGeoChecks).toHaveBeenCalledWith(geoChecks);
		});
	});

	// ── getGeoChecksByMonitor ────────────────────────────────────────────────

	describe("getGeoChecksByMonitor", () => {
		it("returns geo checks from repository", async () => {
			const expected = { geoChecksCount: 1, geoChecks: [{ id: "gc-1" }] };
			const { service, geoChecksRepository } = createService();
			(geoChecksRepository.findByMonitorId as jest.Mock).mockResolvedValue(expected);

			const result = await service.getGeoChecksByMonitor({
				monitorId: "mon-1",
				teamId: "team-1",
				sortOrder: "desc",
				dateRange: "day",
				continent: "NA" as any,
			});

			expect(result).toEqual(expected);
			expect(geoChecksRepository.findByMonitorId).toHaveBeenCalledWith("mon-1", "desc", "day", 0, 5, ["NA"]);
		});

		it("passes array of continents through", async () => {
			const { service, geoChecksRepository } = createService();

			await service.getGeoChecksByMonitor({
				monitorId: "mon-1",
				teamId: "team-1",
				sortOrder: "desc",
				dateRange: "day",
				continent: ["NA", "EU"] as any,
			});

			expect(geoChecksRepository.findByMonitorId).toHaveBeenCalledWith("mon-1", "desc", "day", 0, 5, ["NA", "EU"]);
		});

		it("passes undefined continents when not provided", async () => {
			const { service, geoChecksRepository } = createService();

			await service.getGeoChecksByMonitor({
				monitorId: "mon-1",
				teamId: "team-1",
				sortOrder: "desc",
				dateRange: "day",
				continent: undefined as any,
			});

			expect(geoChecksRepository.findByMonitorId).toHaveBeenCalledWith("mon-1", "desc", "day", 0, 5, undefined);
		});

		it("uses provided page and rowsPerPage", async () => {
			const { service, geoChecksRepository } = createService();

			await service.getGeoChecksByMonitor({
				monitorId: "mon-1",
				teamId: "team-1",
				sortOrder: "asc",
				dateRange: "week",
				page: 3,
				rowsPerPage: 20,
				continent: "EU" as any,
			});

			expect(geoChecksRepository.findByMonitorId).toHaveBeenCalledWith("mon-1", "asc", "week", 3, 20, ["EU"]);
		});

		it("throws when monitorId is missing", async () => {
			const { service } = createService();

			await expect(
				service.getGeoChecksByMonitor({ monitorId: "", teamId: "team-1", sortOrder: "desc", dateRange: "day", continent: "NA" as any })
			).rejects.toThrow("No monitor ID in request");
		});

		it("throws when teamId is missing", async () => {
			const { service } = createService();

			await expect(
				service.getGeoChecksByMonitor({ monitorId: "mon-1", teamId: "", sortOrder: "desc", dateRange: "day", continent: "NA" as any })
			).rejects.toThrow("No team ID in request");
		});

		it("throws 404 when monitor is not found", async () => {
			const { service, monitorsRepository } = createService();
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(null);

			await expect(
				service.getGeoChecksByMonitor({ monitorId: "mon-1", teamId: "team-1", sortOrder: "desc", dateRange: "day", continent: "NA" as any })
			).rejects.toThrow("Monitor with ID mon-1 not found.");
		});
	});
});
