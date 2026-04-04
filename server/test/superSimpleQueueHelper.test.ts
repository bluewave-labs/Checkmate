import { describe, expect, it, jest } from "@jest/globals";
import { SuperSimpleQueueHelper } from "../src/service/infrastructure/SuperSimpleQueue/SuperSimpleQueueHelper.ts";
import type { Monitor } from "../src/types/monitor.ts";
import { createMockLogger } from "./helpers/createMockLogger.ts";

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
		checkService: { buildCheck: jest.fn().mockReturnValue({}), deleteOlderThan: jest.fn().mockResolvedValue(0) },
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
	return { helper, maintenanceWindowsRepository, defaults };
};

describe("SuperSimpleQueueHelper", () => {
	describe("getHeartbeatJob", () => {
		it("skips execution when monitor is in maintenance window", async () => {
			const { helper } = createHelper();
			const spy = jest.spyOn(helper, "isInMaintenanceWindow").mockResolvedValue(true);
			const job = helper.getHeartbeatJob();
			await job({ id: "m1", teamId: "team", interval: 60000 } as Monitor);
			expect(helper["networkService"].requestStatus).not.toHaveBeenCalled();
			expect(helper["logger"].debug).toHaveBeenCalledWith(
				expect.objectContaining({ message: expect.stringContaining("Monitor m1 is in maintenance window") })
			);
			spy.mockRestore();
		});

		it("processes monitor status and notifications when active", async () => {
			const networkResponse = { monitor: { id: "m1" }, status: true, code: 200, message: "OK" };
			const statusServiceMock = {
				updateMonitorStatus: jest.fn().mockResolvedValue({ monitor: { id: "m1", status: "up" }, statusChanged: false, prevStatus: "up", code: 200 }),
			};
			const { helper } = createHelper({
				networkService: { requestStatus: jest.fn().mockResolvedValue(networkResponse) },
				statusService: statusServiceMock,
			});
			jest.spyOn(helper, "isInMaintenanceWindow").mockResolvedValue(false);
			const job = helper.getHeartbeatJob();
			const monitor = { id: "m1", teamId: "team" } as Monitor;
			await job(monitor);
			expect(helper["networkService"].requestStatus).toHaveBeenCalledWith(monitor);
		});

		it("throws when monitor id is missing", async () => {
			const { helper } = createHelper();
			const job = helper.getHeartbeatJob();
			await expect(job({} as Monitor)).rejects.toThrow("No monitor id");
			expect(helper["logger"].warn).toHaveBeenCalled();
		});
	});

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
	});
});
