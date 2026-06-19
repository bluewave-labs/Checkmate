import { describe, expect, it, jest } from "@jest/globals";
import { CheckPipeline, GeoChecksPipeline } from "../../../src/worker/worker.check-pipeline.ts";
import { CheckProducer } from "../../../src/worker/worker.check-producer.ts";
import { CheckEvaluator } from "../../../src/worker/worker.check-evaluator.ts";
import { MonitorStatusPolicy } from "../../../src/worker/worker.monitor-status-policy.ts";
import type { Monitor } from "../../../src/domain/monitors/monitor.types.ts";
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

// ── CheckPipeline ────────────────────────────────────────────────────────────

const createCheckPipeline = (overrides?: Record<string, any>) => {
	const defaults = {
		logger: createMockLogger(),
		networkService: { requestStatus: jest.fn().mockResolvedValue({ monitorId: "m1", status: true, code: 200, message: "OK" }) },
		statusService: {
			updateMonitorStatus: jest.fn().mockResolvedValue({ monitor: { id: "m1", status: "up" }, statusChanged: false, prevStatus: "up", code: 200 }),
		},
		checkService: { toCheck: jest.fn().mockReturnValue({ id: "check-1" }) },
		buffer: { addToBuffer: jest.fn() },
		monitorsRepository: { updateById: jest.fn().mockResolvedValue({}) },
		maintenanceWindowsRepository: { findByMonitorId: jest.fn().mockResolvedValue([]) },
		monitorStatusPolicy: new MonitorStatusPolicy(),
		...overrides,
	};
	const checkProducer = new CheckProducer(
		defaults.monitorsRepository as any,
		defaults.maintenanceWindowsRepository as any,
		defaults.checkService as any,
		defaults.networkService as any,
		defaults.buffer as any,
		defaults.logger as any
	);
	const checkEvaluator = new CheckEvaluator(defaults.statusService as any, defaults.monitorStatusPolicy as any);
	const pipeline = new CheckPipeline(checkProducer, checkEvaluator);
	return { pipeline, defaults };
};

describe("CheckPipeline", () => {
	it("throws when monitor id is missing", async () => {
		const { pipeline } = createCheckPipeline();
		await expect(pipeline.run({} as Monitor)).rejects.toThrow("No monitor id");
	});

	it("skips and sets maintenance status when in maintenance window", async () => {
		const { pipeline, defaults } = createCheckPipeline({
			maintenanceWindowsRepository: { findByMonitorId: jest.fn().mockResolvedValue([activeWindow()]) },
		});

		const result = await pipeline.run(makeMonitor({ status: "up" }));

		expect(result).toBeNull();
		expect(defaults.networkService.requestStatus).not.toHaveBeenCalled();
		expect(defaults.monitorsRepository.updateById).toHaveBeenCalledWith("m1", "team", { status: "maintenance", statusWindow: [] });
	});

	it("does not re-write status when already in maintenance", async () => {
		const { pipeline, defaults } = createCheckPipeline({
			maintenanceWindowsRepository: { findByMonitorId: jest.fn().mockResolvedValue([activeWindow()]) },
		});

		await pipeline.run(makeMonitor({ status: "maintenance" }));

		expect(defaults.monitorsRepository.updateById).not.toHaveBeenCalled();
	});

	it("throws when network response is null", async () => {
		const { pipeline } = createCheckPipeline({
			networkService: { requestStatus: jest.fn().mockResolvedValue(null) },
		});
		await expect(pipeline.run(makeMonitor())).rejects.toThrow("No network response");
	});

	it("returns null and warns when toCheck returns null", async () => {
		const { pipeline, defaults } = createCheckPipeline({
			checkService: { toCheck: jest.fn().mockReturnValue(null) },
		});

		const result = await pipeline.run(makeMonitor());

		expect(result).toBeNull();
		expect(defaults.logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("No check could be built") }));
		expect(defaults.statusService.updateMonitorStatus).not.toHaveBeenCalled();
	});

	it("buffers the check, updates status, and returns an evaluation", async () => {
		const status = { monitorId: "m1", status: false, code: 500, message: "Error" };
		const statusChange = { monitor: { id: "m1", status: "down" }, statusChanged: true, prevStatus: "up", code: 500 };
		const { pipeline, defaults } = createCheckPipeline({
			networkService: { requestStatus: jest.fn().mockResolvedValue(status) },
			statusService: { updateMonitorStatus: jest.fn().mockResolvedValue(statusChange) },
		});

		const result = await pipeline.run(makeMonitor());

		expect(defaults.buffer.addToBuffer).toHaveBeenCalledWith({ id: "check-1" });
		expect(defaults.statusService.updateMonitorStatus).toHaveBeenCalled();
		expect(result).toMatchObject({
			monitor: statusChange.monitor,
			status,
			check: { id: "check-1" },
			statusChange,
			decision: expect.objectContaining({ shouldCreateIncident: true, shouldSendNotification: true, incidentReason: "status_down" }),
		});
	});

	it("proceeds with the check when no maintenance window is active", async () => {
		const { pipeline, defaults } = createCheckPipeline({
			maintenanceWindowsRepository: { findByMonitorId: jest.fn().mockResolvedValue([{ ...activeWindow(), active: false }]) },
		});

		await pipeline.run(makeMonitor());

		expect(defaults.networkService.requestStatus).toHaveBeenCalled();
	});
});

// ── GeoChecksPipeline ──────────────────────────────────────────────────────────

const createGeoPipeline = (overrides?: Record<string, any>) => {
	const defaults = {
		logger: createMockLogger(),
		geoChecksService: { buildGeoCheck: jest.fn().mockResolvedValue(null) },
		buffer: { addGeoCheckToBuffer: jest.fn() },
		maintenanceWindowsRepository: { findByMonitorId: jest.fn().mockResolvedValue([]) },
		...overrides,
	};
	const pipeline = new GeoChecksPipeline(
		defaults.maintenanceWindowsRepository as any,
		defaults.geoChecksService as any,
		defaults.buffer as any,
		defaults.logger as any
	);
	return { pipeline, defaults };
};

const geoMonitor = (overrides?: Partial<Monitor>) =>
	makeMonitor({ geoCheckEnabled: true, type: "http", geoCheckLocations: ["us-east"], ...overrides });

describe("GeoChecksPipeline", () => {
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
