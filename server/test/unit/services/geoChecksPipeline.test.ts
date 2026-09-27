import { describe, expect, it, jest } from "@jest/globals";
import { GeoChecksPipeline } from "../../../src/worker/worker.geo-pipeline.ts";
import type { Job } from "../../../src/domain/jobs/job.type.ts";
import type { Monitor } from "../../../src/domain/monitors/monitor.type.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "m1",
		teamId: "team",
		type: "http",
		interval: 60000,
		status: "up",
		geoCheckEnabled: false,
		geoCheckLocations: [],
		...overrides,
	}) as Monitor;

const activeWindow = () => {
	const now = Date.now();
	return { active: true, start: new Date(now - 1000).toISOString(), end: new Date(now + 1000).toISOString(), repeat: 0 };
};

// ── GeoChecksPipeline ──────────────────────────────────────────────────────────

const createGeoPipeline = (overrides?: Record<string, any>) => {
	const defaults = {
		logger: createMockLogger(),
		monitorsRepository: { findByIdLean: jest.fn().mockResolvedValue(null) },
		geoChecksService: { buildGeoCheck: jest.fn().mockResolvedValue(null) },
		buffer: { addGeoCheckToBuffer: jest.fn() },
		maintenanceWindowsRepository: { findByMonitorId: jest.fn().mockResolvedValue([]) },
		...overrides,
	};
	const pipeline = new GeoChecksPipeline(
		defaults.monitorsRepository as any,
		defaults.maintenanceWindowsRepository as any,
		defaults.geoChecksService as any,
		defaults.buffer as any,
		defaults.logger as any
	);
	return { pipeline, defaults };
};

const geoMonitor = (overrides?: Partial<Monitor>) =>
	makeMonitor({ geoCheckEnabled: true, type: "http", geoCheckLocations: ["us-east"], ...overrides });

const makeJob = (overrides?: Partial<Job>): Job => ({
	id: "geo-check:m1",
	type: "geo-check",
	refId: "m1",
	isActive: true,
	nextScheduledAt: 1000,
	intervalMs: 300000,
	lockedBy: null,
	lockedUntil: null,
	pendingChecks: [],
	runCount: 0,
	failCount: 0,
	lastFinishedAt: null,
	lastFailReason: null,
	...overrides,
});

describe("GeoChecksPipeline", () => {
	describe("handle", () => {
		it("loads the monitor by refId and runs the pipeline for it", async () => {
			const geoCheck = { id: "gc-1", monitorId: "m1" };
			const { pipeline, defaults } = createGeoPipeline({
				monitorsRepository: { findByIdLean: jest.fn().mockResolvedValue(geoMonitor()) },
				geoChecksService: { buildGeoCheck: jest.fn().mockResolvedValue(geoCheck) },
			});

			await pipeline.handle(makeJob());

			expect(defaults.monitorsRepository.findByIdLean).toHaveBeenCalledWith("m1");
			expect(defaults.buffer.addGeoCheckToBuffer).toHaveBeenCalledWith(geoCheck);
		});

		it("does nothing for a job without a refId", async () => {
			const { pipeline, defaults } = createGeoPipeline();

			await pipeline.handle(makeJob({ refId: null }));

			expect(defaults.monitorsRepository.findByIdLean).not.toHaveBeenCalled();
			expect(defaults.geoChecksService.buildGeoCheck).not.toHaveBeenCalled();
		});

		it("does nothing when the monitor no longer exists", async () => {
			const { pipeline, defaults } = createGeoPipeline();

			await pipeline.handle(makeJob());

			expect(defaults.geoChecksService.buildGeoCheck).not.toHaveBeenCalled();
		});
	});

	it("throws when monitor id is missing", async () => {
		const { pipeline } = createGeoPipeline();
		await expect(pipeline.run({} as Monitor)).rejects.toThrow("No monitor id");
	});

	it("returns null when geoCheckEnabled is false", async () => {
		const { pipeline, defaults } = createGeoPipeline();
		const result = await pipeline.run(makeMonitor({ geoCheckEnabled: false }));
		expect(result).toBeNull();
		expect(defaults.geoChecksService.buildGeoCheck).not.toHaveBeenCalled();
	});

	it("returns null when monitor type does not support geo checks", async () => {
		const { pipeline, defaults } = createGeoPipeline();
		await pipeline.run(geoMonitor({ type: "hardware" }));
		expect(defaults.logger.debug).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("does not support geo checks") }));
		expect(defaults.geoChecksService.buildGeoCheck).not.toHaveBeenCalled();
	});

	it("warns when geoCheckLocations is empty", async () => {
		const { pipeline, defaults } = createGeoPipeline();
		await pipeline.run(geoMonitor({ geoCheckLocations: [] }));
		expect(defaults.logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("No geo check locations") }));
	});

	it("warns when geoCheckLocations is undefined", async () => {
		const { pipeline, defaults } = createGeoPipeline();
		await pipeline.run(geoMonitor({ geoCheckLocations: undefined as any }));
		expect(defaults.logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("No geo check locations") }));
	});

	it("skips when in maintenance window", async () => {
		const { pipeline, defaults } = createGeoPipeline({
			maintenanceWindowsRepository: { findByMonitorId: jest.fn().mockResolvedValue([activeWindow()]) },
		});
		await pipeline.run(geoMonitor());
		expect(defaults.logger.debug).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("maintenance window") }));
		expect(defaults.geoChecksService.buildGeoCheck).not.toHaveBeenCalled();
	});

	it("warns when buildGeoCheck returns null", async () => {
		const { pipeline, defaults } = createGeoPipeline();
		await pipeline.run(geoMonitor());
		expect(defaults.logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("No geo check could be built") }));
	});

	it("adds geo check to buffer on success", async () => {
		const geoCheck = { id: "gc-1", monitorId: "m1" };
		const { pipeline, defaults } = createGeoPipeline({
			geoChecksService: { buildGeoCheck: jest.fn().mockResolvedValue(geoCheck) },
		});
		await pipeline.run(geoMonitor());
		expect(defaults.buffer.addGeoCheckToBuffer).toHaveBeenCalledWith(geoCheck);
		expect(defaults.logger.debug).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("Geo check job executed") }));
	});

	it("propagates errors (the job glue handles isolation)", async () => {
		const { pipeline } = createGeoPipeline({
			geoChecksService: { buildGeoCheck: jest.fn().mockRejectedValue(new Error("api timeout")) },
		});
		await expect(pipeline.run(geoMonitor())).rejects.toThrow("api timeout");
	});
});
