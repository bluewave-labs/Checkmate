import { describe, expect, it, jest } from "@jest/globals";
import { SuperSimpleQueueHelper } from "../../../src/service/infrastructure/SuperSimpleQueue/SuperSimpleQueueHelper.ts";
import type { Monitor } from "../../../src/types/monitor.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const createHelper = (overrides?: Record<string, unknown>) => {
	const maintenanceWindowsRepository = {
		findByMonitorId: jest.fn().mockResolvedValue([]),
	};
	const monitorsRepository = {
		updateById: jest.fn().mockResolvedValue({}),
		findAllMonitorIds: jest.fn().mockResolvedValue(["m1"]),
		deleteByTeamIdsNotIn: jest.fn().mockResolvedValue(0),
	};
	const teamsRepository = {
		findAllTeamIds: jest.fn().mockResolvedValue(["team"]),
	};
	const monitorStatsRepository = {
		deleteByMonitorIdsNotIn: jest.fn().mockResolvedValue(0),
	};
	const checksRepository = {
		deleteByMonitorIdsNotIn: jest.fn().mockResolvedValue(0),
	};
	const incidentsRepository = {
		deleteByMonitorIdsNotIn: jest.fn().mockResolvedValue(0),
	};
	const geoChecksRepository = {
		deleteByMonitorIdsNotIn: jest.fn().mockResolvedValue(0),
	};
	const statusServiceMock = {
		updateMonitorStatus: jest.fn().mockResolvedValue({ monitor: { id: "m1", status: "up" }, statusChanged: false, prevStatus: "up", code: 200 }),
	};
	const settingsServiceMock = {
		getDBSettings: jest.fn().mockResolvedValue({ checkTTL: 30 }),
	};
	const geoChecksServiceMock = {
		buildGeoCheck: jest.fn().mockResolvedValue(null),
	};

	const defaults = {
		logger: createMockLogger(),
		networkService: { requestStatus: jest.fn() },
		statusService: statusServiceMock,
		notificationsService: { handleNotifications: jest.fn().mockResolvedValue(undefined) },
		checkService: { buildCheck: jest.fn().mockReturnValue({ id: "check-1" }), deleteOlderThan: jest.fn().mockResolvedValue(0) },
		settingsService: settingsServiceMock,
		buffer: { addToBuffer: jest.fn(), addGeoCheckToBuffer: jest.fn() },
		incidentService: { handleIncident: jest.fn().mockResolvedValue(undefined) },
		maintenanceWindowsRepository,
		monitorsRepository,
		teamsRepository,
		monitorStatsRepository,
		checksRepository,
		incidentsRepository,
		geoChecksService: geoChecksServiceMock,
		geoChecksRepository,
		...overrides,
	};

	const helper = new SuperSimpleQueueHelper(
		defaults.logger as any,
		defaults.networkService as any,
		defaults.statusService as any,
		defaults.notificationsService as any,
		defaults.checkService as any,
		defaults.settingsService as any,
		defaults.buffer as any,
		defaults.incidentService as any,
		defaults.maintenanceWindowsRepository as any,
		defaults.monitorsRepository as any,
		defaults.teamsRepository as any,
		defaults.monitorStatsRepository as any,
		defaults.checksRepository as any,
		defaults.incidentsRepository as any,
		defaults.geoChecksService as any,
		defaults.geoChecksRepository as any
	);
	return { helper, defaults, maintenanceWindowsRepository };
};

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

// ── Tests ────────────────────────────────────────────────────────────────────

describe("SuperSimpleQueueHelper", () => {
	describe("serviceName", () => {
		it("returns JobQueueHelper", () => {
			const { helper } = createHelper();
			expect(helper.serviceName).toBe("JobQueueHelper");
		});
	});

	// ── getHeartbeatJob ──────────────────────────────────────────────────────

	describe("getHeartbeatJob", () => {
		it("throws when monitor id is missing", async () => {
			const { helper } = createHelper();
			const job = helper.getHeartbeatJob();
			await expect(job({} as Monitor)).rejects.toThrow("No monitor id");
		});

		it("skips execution and sets maintenance status when in maintenance window", async () => {
			const { helper, defaults } = createHelper();
			jest.spyOn(helper, "isInMaintenanceWindow").mockResolvedValue(true);
			const job = helper.getHeartbeatJob();

			await job(makeMonitor({ status: "up" }));

			expect(defaults.networkService.requestStatus).not.toHaveBeenCalled();
			expect(defaults.monitorsRepository.updateById).toHaveBeenCalledWith("m1", "team", { status: "maintenance" });
		});

		it("skips monitor status update when already in maintenance", async () => {
			const { helper, defaults } = createHelper();
			jest.spyOn(helper, "isInMaintenanceWindow").mockResolvedValue(true);
			const job = helper.getHeartbeatJob();

			await job(makeMonitor({ status: "maintenance" }));

			expect(defaults.monitorsRepository.updateById).not.toHaveBeenCalled();
		});

		it("throws when network response is null", async () => {
			const { helper } = createHelper({
				networkService: { requestStatus: jest.fn().mockResolvedValue(null) },
			});
			jest.spyOn(helper, "isInMaintenanceWindow").mockResolvedValue(false);
			const job = helper.getHeartbeatJob();

			await expect(job(makeMonitor())).rejects.toThrow("No network response");
		});

		it("returns early and warns when buildCheck returns null", async () => {
			const networkResponse = { monitorId: "m1", status: true, code: 200, message: "OK" };
			const { helper, defaults } = createHelper({
				networkService: { requestStatus: jest.fn().mockResolvedValue(networkResponse) },
				checkService: { buildCheck: jest.fn().mockReturnValue(null), deleteOlderThan: jest.fn() },
			});
			jest.spyOn(helper, "isInMaintenanceWindow").mockResolvedValue(false);
			const job = helper.getHeartbeatJob();

			await job(makeMonitor());

			expect(defaults.logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("No check could be built") }));
			expect(defaults.statusService.updateMonitorStatus).not.toHaveBeenCalled();
		});

		it("processes full pipeline: network → check → status → incident", async () => {
			const networkResponse = { monitorId: "m1", status: true, code: 200, message: "OK" };
			const { helper, defaults } = createHelper({
				networkService: { requestStatus: jest.fn().mockResolvedValue(networkResponse) },
			});
			jest.spyOn(helper, "isInMaintenanceWindow").mockResolvedValue(false);
			const job = helper.getHeartbeatJob();

			await job(makeMonitor());

			expect(defaults.buffer.addToBuffer).toHaveBeenCalled();
			expect(defaults.statusService.updateMonitorStatus).toHaveBeenCalled();
			expect(defaults.incidentService.handleIncident).toHaveBeenCalled();
		});

		it("sends notifications when decision says shouldSendNotification", async () => {
			const networkResponse = { monitorId: "m1", status: false, code: 500, message: "Error" };
			const statusResult = { monitor: { id: "m1", status: "down" }, statusChanged: true, prevStatus: "up", code: 500 };
			const { helper, defaults } = createHelper({
				networkService: { requestStatus: jest.fn().mockResolvedValue(networkResponse) },
				statusService: { updateMonitorStatus: jest.fn().mockResolvedValue(statusResult) },
			});
			jest.spyOn(helper, "isInMaintenanceWindow").mockResolvedValue(false);
			const job = helper.getHeartbeatJob();

			await job(makeMonitor());

			expect(defaults.notificationsService.handleNotifications).toHaveBeenCalledWith(
				statusResult.monitor,
				networkResponse,
				expect.objectContaining({ shouldSendNotification: true, shouldCreateIncident: true })
			);
		});

		it("logs error when notifications fail (fire-and-forget)", async () => {
			const networkResponse = { monitorId: "m1", status: false, code: 500, message: "Error" };
			const statusResult = { monitor: { id: "m1", status: "down" }, statusChanged: true, prevStatus: "up", code: 500 };
			const notificationsService = { handleNotifications: jest.fn().mockRejectedValue(new Error("smtp down")) };
			const { helper, defaults } = createHelper({
				networkService: { requestStatus: jest.fn().mockResolvedValue(networkResponse) },
				statusService: { updateMonitorStatus: jest.fn().mockResolvedValue(statusResult) },
				notificationsService,
			});
			jest.spyOn(helper, "isInMaintenanceWindow").mockResolvedValue(false);
			const job = helper.getHeartbeatJob();

			await job(makeMonitor());

			// Wait for the fire-and-forget catch to execute
			await new Promise((r) => setTimeout(r, 10));
			expect(defaults.logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("smtp down") }));
		});

		it("logs error when notifications fail with non-Error (fire-and-forget)", async () => {
			const networkResponse = { monitorId: "m1", status: false, code: 500, message: "Error" };
			const statusResult = { monitor: { id: "m1", status: "down" }, statusChanged: true, prevStatus: "up", code: 500 };
			const notificationsService = { handleNotifications: jest.fn().mockRejectedValue("string error") };
			const { helper, defaults } = createHelper({
				networkService: { requestStatus: jest.fn().mockResolvedValue(networkResponse) },
				statusService: { updateMonitorStatus: jest.fn().mockResolvedValue(statusResult) },
				notificationsService,
			});
			jest.spyOn(helper, "isInMaintenanceWindow").mockResolvedValue(false);
			const job = helper.getHeartbeatJob();

			await job(makeMonitor());
			await new Promise((r) => setTimeout(r, 10));
			expect(defaults.logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("Unknown error") }));
		});

		it("logs warning when incident handling fails (fire-and-forget)", async () => {
			const networkResponse = { monitorId: "m1", status: true, code: 200, message: "OK" };
			const incidentService = { handleIncident: jest.fn().mockRejectedValue(new Error("db error")) };
			const { helper, defaults } = createHelper({
				networkService: { requestStatus: jest.fn().mockResolvedValue(networkResponse) },
				incidentService,
			});
			jest.spyOn(helper, "isInMaintenanceWindow").mockResolvedValue(false);
			const job = helper.getHeartbeatJob();

			await job(makeMonitor());
			await new Promise((r) => setTimeout(r, 10));
			expect(defaults.logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("db error") }));
		});

		it("logs warning when incident handling fails with non-Error", async () => {
			const networkResponse = { monitorId: "m1", status: true, code: 200, message: "OK" };
			const incidentService = { handleIncident: jest.fn().mockRejectedValue(42) };
			const { helper, defaults } = createHelper({
				networkService: { requestStatus: jest.fn().mockResolvedValue(networkResponse) },
				incidentService,
			});
			jest.spyOn(helper, "isInMaintenanceWindow").mockResolvedValue(false);
			const job = helper.getHeartbeatJob();

			await job(makeMonitor());
			await new Promise((r) => setTimeout(r, 10));
			expect(defaults.logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("Unknown error") }));
		});

		it("logs and rethrows on unexpected error with non-Error", async () => {
			const { helper } = createHelper({
				networkService: { requestStatus: jest.fn().mockRejectedValue("unexpected") },
			});
			jest.spyOn(helper, "isInMaintenanceWindow").mockResolvedValue(false);
			const job = helper.getHeartbeatJob();

			await expect(job(makeMonitor())).rejects.toBe("unexpected");
		});
	});

	// ── getHeartbeatGeoJob ───────────────────────────────────────────────────

	describe("getHeartbeatGeoJob", () => {
		it("throws nothing when monitor id is missing (logs error)", async () => {
			const { helper, defaults } = createHelper();
			const job = helper.getHeartbeatGeoJob();

			await job({} as Monitor);

			expect(defaults.logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: "No monitor id" }));
		});

		it("returns early when geoCheckEnabled is false", async () => {
			const { helper, defaults } = createHelper();
			const job = helper.getHeartbeatGeoJob();

			await job(makeMonitor({ geoCheckEnabled: false }));

			expect(defaults.geoChecksService.buildGeoCheck).not.toHaveBeenCalled();
		});

		it("returns early when monitor type does not support geo checks", async () => {
			const { helper, defaults } = createHelper();
			const job = helper.getHeartbeatGeoJob();

			await job(makeMonitor({ geoCheckEnabled: true, type: "hardware", geoCheckLocations: ["us-east"] }));

			expect(defaults.logger.debug).toHaveBeenCalledWith(
				expect.objectContaining({ message: expect.stringContaining("does not support geo checks") })
			);
			expect(defaults.geoChecksService.buildGeoCheck).not.toHaveBeenCalled();
		});

		it("returns early when geoCheckLocations is empty", async () => {
			const { helper, defaults } = createHelper();
			const job = helper.getHeartbeatGeoJob();

			await job(makeMonitor({ geoCheckEnabled: true, type: "http", geoCheckLocations: [] }));

			expect(defaults.logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("No geo check locations") }));
		});

		it("returns early when geoCheckLocations is undefined", async () => {
			const { helper, defaults } = createHelper();
			const job = helper.getHeartbeatGeoJob();

			await job(makeMonitor({ geoCheckEnabled: true, type: "http", geoCheckLocations: undefined as any }));

			expect(defaults.logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("No geo check locations") }));
		});

		it("skips when in maintenance window", async () => {
			const { helper, defaults } = createHelper();
			jest.spyOn(helper, "isInMaintenanceWindow").mockResolvedValue(true);
			const job = helper.getHeartbeatGeoJob();

			await job(makeMonitor({ geoCheckEnabled: true, type: "http", geoCheckLocations: ["us-east"] }));

			expect(defaults.logger.debug).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("maintenance window") }));
			expect(defaults.geoChecksService.buildGeoCheck).not.toHaveBeenCalled();
		});

		it("warns when buildGeoCheck returns null", async () => {
			const { helper, defaults } = createHelper();
			jest.spyOn(helper, "isInMaintenanceWindow").mockResolvedValue(false);
			const job = helper.getHeartbeatGeoJob();

			await job(makeMonitor({ geoCheckEnabled: true, type: "http", geoCheckLocations: ["us-east"] }));

			expect(defaults.logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("No geo check could be built") }));
		});

		it("adds geo check to buffer on success", async () => {
			const geoCheck = { id: "gc-1", monitorId: "m1" };
			const { helper, defaults } = createHelper({
				geoChecksService: { buildGeoCheck: jest.fn().mockResolvedValue(geoCheck) },
			});
			jest.spyOn(helper, "isInMaintenanceWindow").mockResolvedValue(false);
			const job = helper.getHeartbeatGeoJob();

			await job(makeMonitor({ geoCheckEnabled: true, type: "http", geoCheckLocations: ["us-east"] }));

			expect(defaults.buffer.addGeoCheckToBuffer).toHaveBeenCalledWith(geoCheck);
			expect(defaults.logger.debug).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("Geo check job executed") }));
		});

		it("logs error on unexpected failure without rethrowing", async () => {
			const { helper, defaults } = createHelper({
				geoChecksService: { buildGeoCheck: jest.fn().mockRejectedValue(new Error("api timeout")) },
			});
			jest.spyOn(helper, "isInMaintenanceWindow").mockResolvedValue(false);
			const job = helper.getHeartbeatGeoJob();

			await job(makeMonitor({ geoCheckEnabled: true, type: "http", geoCheckLocations: ["us-east"] }));

			expect(defaults.logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: "api timeout" }));
		});

		it("logs 'Unknown error' for non-Error exceptions", async () => {
			const { helper, defaults } = createHelper({
				geoChecksService: { buildGeoCheck: jest.fn().mockRejectedValue("string error") },
			});
			jest.spyOn(helper, "isInMaintenanceWindow").mockResolvedValue(false);
			const job = helper.getHeartbeatGeoJob();

			await job(makeMonitor({ geoCheckEnabled: true, type: "http", geoCheckLocations: ["us-east"] }));

			expect(defaults.logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: "Unknown error", stack: undefined }));
		});
	});

	// ── getCleanupOrphanedJob ────────────────────────────────────────────────

	describe("getCleanupOrphanedJob", () => {
		it("cleans up orphaned data across all repositories", async () => {
			const { helper, defaults } = createHelper();
			(defaults.monitorsRepository.deleteByTeamIdsNotIn as jest.Mock).mockResolvedValue(2);
			(defaults.monitorStatsRepository.deleteByMonitorIdsNotIn as jest.Mock).mockResolvedValue(3);
			(defaults.checksRepository.deleteByMonitorIdsNotIn as jest.Mock).mockResolvedValue(4);
			(defaults.incidentsRepository.deleteByMonitorIdsNotIn as jest.Mock).mockResolvedValue(1);
			(defaults.geoChecksRepository.deleteByMonitorIdsNotIn as jest.Mock).mockResolvedValue(5);

			const job = helper.getCleanupOrphanedJob();
			await job();

			expect(defaults.teamsRepository.findAllTeamIds).toHaveBeenCalled();
			expect(defaults.monitorsRepository.deleteByTeamIdsNotIn).toHaveBeenCalledWith(["team"]);
			expect(defaults.monitorsRepository.findAllMonitorIds).toHaveBeenCalled();
			expect(defaults.monitorStatsRepository.deleteByMonitorIdsNotIn).toHaveBeenCalledWith(["m1"]);
			expect(defaults.checksRepository.deleteByMonitorIdsNotIn).toHaveBeenCalledWith(["m1"]);
			expect(defaults.incidentsRepository.deleteByMonitorIdsNotIn).toHaveBeenCalledWith(["m1"]);
			expect(defaults.geoChecksRepository.deleteByMonitorIdsNotIn).toHaveBeenCalledWith(["m1"]);
			// Logs info for each deleted count > 0
			expect(defaults.logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("2 orphaned monitors") }));
			expect(defaults.logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("3 orphaned monitor stats") }));
			expect(defaults.logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("4 orphaned checks") }));
			expect(defaults.logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("1 orphaned incidents") }));
			expect(defaults.logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("5 orphaned geo checks") }));
		});

		it("skips info logs when no orphaned data is found", async () => {
			const { helper, defaults } = createHelper();
			const job = helper.getCleanupOrphanedJob();
			await job();

			// Only start and completion logs, no deletion logs
			const infoMessages = (defaults.logger.info as jest.Mock).mock.calls.map((c: any) => c[0].message);
			expect(infoMessages).toContain("Starting cleanup of orphaned data");
			expect(infoMessages).toContain("Cleanup of orphaned data completed");
			expect(infoMessages).not.toContain(expect.stringContaining("orphaned monitors"));
		});

		it("logs warning and rethrows on error", async () => {
			const { helper, defaults } = createHelper();
			(defaults.teamsRepository.findAllTeamIds as jest.Mock).mockRejectedValue(new Error("db down"));
			const job = helper.getCleanupOrphanedJob();

			await expect(job()).rejects.toThrow("db down");
			expect(defaults.logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: "db down" }));
		});

		it("logs 'Unknown error' for non-Error exceptions", async () => {
			const { helper, defaults } = createHelper();
			(defaults.teamsRepository.findAllTeamIds as jest.Mock).mockRejectedValue(null);
			const job = helper.getCleanupOrphanedJob();

			await expect(job()).rejects.toBeNull();
			expect(defaults.logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: "Unknown error", stack: undefined }));
		});
	});

	// ── getCleanupRetentionJob ───────────────────────────────────────────────

	describe("getCleanupRetentionJob", () => {
		it("deletes checks older than TTL cutoff", async () => {
			const { helper, defaults } = createHelper();
			const job = helper.getCleanupRetentionJob();
			await job();

			expect(defaults.checkService.deleteOlderThan).toHaveBeenCalledWith(expect.any(Date));
			expect(defaults.logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("Deleted") }));
		});

		it("skips cleanup when checkTTL is sentinel value (366)", async () => {
			const { helper, defaults } = createHelper({
				settingsService: { getDBSettings: jest.fn().mockResolvedValue({ checkTTL: 366 }) },
			});
			const job = helper.getCleanupRetentionJob();
			await job();

			expect(defaults.checkService.deleteOlderThan).not.toHaveBeenCalled();
			expect(defaults.logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("unlimited") }));
		});

		it("logs error on failure without rethrowing", async () => {
			const { helper, defaults } = createHelper({
				settingsService: { getDBSettings: jest.fn().mockRejectedValue(new Error("db error")) },
			});
			const job = helper.getCleanupRetentionJob();

			await job(); // Should not throw

			expect(defaults.logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: "db error" }));
		});

		it("logs 'Unknown error' for non-Error exceptions", async () => {
			const { helper, defaults } = createHelper({
				settingsService: { getDBSettings: jest.fn().mockRejectedValue("boom") },
			});
			const job = helper.getCleanupRetentionJob();
			await job();

			expect(defaults.logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: "Unknown error", stack: undefined }));
		});
	});

	// ── isInMaintenanceWindow ────────────────────────────────────────────────

	describe("isInMaintenanceWindow", () => {
		it("returns true when an active window spans now", async () => {
			const now = new Date();
			const { helper, maintenanceWindowsRepository } = createHelper();
			maintenanceWindowsRepository.findByMonitorId.mockResolvedValue([
				{
					active: true,
					start: new Date(now.getTime() - 1000).toISOString(),
					end: new Date(now.getTime() + 1000).toISOString(),
					repeat: 0,
				},
			]);
			await expect(helper.isInMaintenanceWindow("m1", "team")).resolves.toBe(true);
		});

		it("returns true when repeat interval advances window into current time", async () => {
			const now = Date.now();
			const { helper, maintenanceWindowsRepository } = createHelper();
			maintenanceWindowsRepository.findByMonitorId.mockResolvedValue([
				{
					active: true,
					start: new Date(now - 7200000).toISOString(),
					end: new Date(now - 6600000).toISOString(),
					repeat: 3600000,
				},
			]);
			await expect(helper.isInMaintenanceWindow("m1", "team")).resolves.toBe(true);
		});

		it("returns false when no active windows exist", async () => {
			const { helper } = createHelper();
			await expect(helper.isInMaintenanceWindow("m1", "team")).resolves.toBe(false);
		});

		it("returns false when window is inactive", async () => {
			const now = new Date();
			const { helper, maintenanceWindowsRepository } = createHelper();
			maintenanceWindowsRepository.findByMonitorId.mockResolvedValue([
				{
					active: false,
					start: new Date(now.getTime() - 1000).toISOString(),
					end: new Date(now.getTime() + 1000).toISOString(),
					repeat: 0,
				},
			]);
			await expect(helper.isInMaintenanceWindow("m1", "team")).resolves.toBe(false);
		});

		it("returns false when active window is in the past without repeat", async () => {
			const now = Date.now();
			const { helper, maintenanceWindowsRepository } = createHelper();
			maintenanceWindowsRepository.findByMonitorId.mockResolvedValue([
				{
					active: true,
					start: new Date(now - 5000).toISOString(),
					end: new Date(now - 1000).toISOString(),
					repeat: 0,
				},
			]);
			await expect(helper.isInMaintenanceWindow("m1", "team")).resolves.toBe(false);
		});

		it("returns false when repeat advances past current time without match", async () => {
			const now = Date.now();
			const { helper, maintenanceWindowsRepository } = createHelper();
			// Window was 2 hours ago, lasts 10 minutes, repeats every hour
			// First repeat: -1h to -50min (past), second repeat: now to +10min... actually this would match
			// Use a repeat that skips over now
			maintenanceWindowsRepository.findByMonitorId.mockResolvedValue([
				{
					active: true,
					start: new Date(now - 3600000 * 3 - 300000).toISOString(), // 3h5min ago
					end: new Date(now - 3600000 * 3).toISOString(), // 3h ago, 5min window
					repeat: 3600000, // 1 hour repeat
				},
			]);
			// Advances: -2h5m to -2h, -1h5m to -1h, -5m to 0 — that last one might match if now is within 5min
			// Let's use a different setup that clearly doesn't match
			maintenanceWindowsRepository.findByMonitorId.mockResolvedValue([
				{
					active: true,
					start: new Date(now - 1800000 - 60000).toISOString(), // 31 min ago
					end: new Date(now - 1800000).toISOString(), // 30 min ago, 1 min window
					repeat: 3600000, // 1 hour repeat — next window would be in 29 min
				},
			]);
			await expect(helper.isInMaintenanceWindow("m1", "team")).resolves.toBe(false);
		});

		it("preserves previous true result via accumulator", async () => {
			const now = new Date();
			const { helper, maintenanceWindowsRepository } = createHelper();
			maintenanceWindowsRepository.findByMonitorId.mockResolvedValue([
				{
					active: true,
					start: new Date(now.getTime() - 1000).toISOString(),
					end: new Date(now.getTime() + 1000).toISOString(),
					repeat: 0,
				},
				{
					active: false,
					start: new Date(now.getTime() - 1000).toISOString(),
					end: new Date(now.getTime() + 1000).toISOString(),
					repeat: 0,
				},
			]);
			// Second window is inactive but first already matched — accumulator should preserve true
			await expect(helper.isInMaintenanceWindow("m1", "team")).resolves.toBe(true);
		});
	});

	// ── evaluateMonitorAction (tested indirectly via getHeartbeatJob) ─────────

	describe("evaluateMonitorAction", () => {
		const runJobAndGetDecision = async (statusResult: Record<string, unknown>) => {
			const networkResponse = { monitorId: "m1", status: true, code: 200, message: "OK" };
			const incidentService = { handleIncident: jest.fn().mockResolvedValue(undefined) };
			const notificationsService = { handleNotifications: jest.fn().mockResolvedValue(undefined) };
			const { helper } = createHelper({
				networkService: { requestStatus: jest.fn().mockResolvedValue(networkResponse) },
				statusService: { updateMonitorStatus: jest.fn().mockResolvedValue(statusResult) },
				incidentService,
				notificationsService,
			});
			jest.spyOn(helper, "isInMaintenanceWindow").mockResolvedValue(false);
			const job = helper.getHeartbeatJob();
			await job(makeMonitor());
			return { incidentService, notificationsService };
		};

		it("does nothing when statusChanged is false", async () => {
			const { incidentService, notificationsService } = await runJobAndGetDecision({
				monitor: { id: "m1", status: "up" },
				statusChanged: false,
				prevStatus: "up",
				code: 200,
			});
			expect(incidentService.handleIncident).toHaveBeenCalledWith(
				expect.anything(),
				expect.anything(),
				expect.objectContaining({ shouldCreateIncident: false, shouldResolveIncident: false, shouldSendNotification: false }),
				expect.anything()
			);
		});

		it("creates incident and notifies when monitor goes down", async () => {
			const { incidentService } = await runJobAndGetDecision({
				monitor: { id: "m1", status: "down" },
				statusChanged: true,
				prevStatus: "up",
				code: 500,
			});
			expect(incidentService.handleIncident).toHaveBeenCalledWith(
				expect.anything(),
				expect.anything(),
				expect.objectContaining({
					shouldCreateIncident: true,
					shouldSendNotification: true,
					incidentReason: "status_down",
					notificationReason: "status_change",
				}),
				expect.anything()
			);
		});

		it("creates incident and notifies when monitor is breached", async () => {
			const { incidentService } = await runJobAndGetDecision({
				monitor: { id: "m1", status: "breached" },
				statusChanged: true,
				prevStatus: "up",
				code: 200,
			});
			expect(incidentService.handleIncident).toHaveBeenCalledWith(
				expect.anything(),
				expect.anything(),
				expect.objectContaining({
					shouldCreateIncident: true,
					incidentReason: "threshold_breach",
					notificationReason: "threshold_breach",
				}),
				expect.anything()
			);
		});

		it("resolves incident when monitor recovers from down", async () => {
			const { incidentService } = await runJobAndGetDecision({
				monitor: { id: "m1", status: "up" },
				statusChanged: true,
				prevStatus: "down",
				code: 200,
			});
			expect(incidentService.handleIncident).toHaveBeenCalledWith(
				expect.anything(),
				expect.anything(),
				expect.objectContaining({ shouldResolveIncident: true, shouldSendNotification: true }),
				expect.anything()
			);
		});

		it("resolves incident when monitor recovers from breached", async () => {
			const { incidentService } = await runJobAndGetDecision({
				monitor: { id: "m1", status: "up" },
				statusChanged: true,
				prevStatus: "breached",
				code: 200,
			});
			expect(incidentService.handleIncident).toHaveBeenCalledWith(
				expect.anything(),
				expect.anything(),
				expect.objectContaining({ shouldResolveIncident: true }),
				expect.anything()
			);
		});

		it("does not create or resolve for unhandled status transitions", async () => {
			const { incidentService } = await runJobAndGetDecision({
				monitor: { id: "m1", status: "paused" },
				statusChanged: true,
				prevStatus: "up",
				code: 200,
			});
			expect(incidentService.handleIncident).toHaveBeenCalledWith(
				expect.anything(),
				expect.anything(),
				expect.objectContaining({ shouldCreateIncident: false, shouldResolveIncident: false, shouldSendNotification: false }),
				expect.anything()
			);
		});
	});
});
