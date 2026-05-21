import { describe, expect, it, jest } from "@jest/globals";
import { MaintenanceWindowService } from "../../../src/service/business/maintenanceWindowService.ts";
import type { IMaintenanceWindowsRepository } from "../../../src/repositories/maintenance-windows/IMaintenanceWindowsRepository.ts";
import type { IMonitorsRepository } from "../../../src/repositories/monitors/IMonitorsRepository.ts";
import type { MaintenanceWindow } from "../../../src/types/index.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const createMaintenanceWindowsRepo = () =>
	({
		create: jest.fn().mockResolvedValue(makeWindow()),
		findById: jest.fn().mockResolvedValue(makeWindow()),
		findByMonitorId: jest.fn().mockResolvedValue([makeWindow()]),
		findByMonitorIds: jest.fn().mockResolvedValue([]),
		findByTeamId: jest.fn().mockResolvedValue([makeWindow()]),
		updateById: jest.fn().mockResolvedValue(makeWindow()),
		deleteById: jest.fn().mockResolvedValue(makeWindow()),
		countByTeamId: jest.fn().mockResolvedValue(1),
	}) as unknown as jest.Mocked<IMaintenanceWindowsRepository>;

const createMonitorsRepo = () =>
	({
		findByIds: jest.fn().mockResolvedValue([
			{ id: "mon-1", teamId: "team-1" },
			{ id: "mon-2", teamId: "team-1" },
		]),
		updateByIds: jest.fn().mockResolvedValue(0),
	}) as unknown as jest.Mocked<IMonitorsRepository>;

const createService = (overrides?: {
	monitorsRepository?: ReturnType<typeof createMonitorsRepo>;
	maintenanceWindowsRepository?: ReturnType<typeof createMaintenanceWindowsRepo>;
}) => {
	const monitorsRepository = overrides?.monitorsRepository ?? createMonitorsRepo();
	const maintenanceWindowsRepository = overrides?.maintenanceWindowsRepository ?? createMaintenanceWindowsRepo();
	const service = new MaintenanceWindowService({ monitorsRepository, maintenanceWindowsRepository });
	return { service, monitorsRepository, maintenanceWindowsRepository };
};

const makeWindow = (overrides?: Partial<MaintenanceWindow>): MaintenanceWindow => ({
	id: "mw-1",
	monitorIds: ["mon-1"],
	teamId: "team-1",
	active: true,
	name: "Scheduled Maintenance",
	duration: 60,
	durationUnit: "minutes",
	repeat: 0,
	start: "2026-04-10T02:00:00Z",
	end: "2026-04-10T03:00:00Z",
	createdAt: "2026-01-01T00:00:00Z",
	updatedAt: "2026-01-01T00:00:00Z",
	...overrides,
});

// A window whose start/end straddle "now" — active per isWindowActive
const makeActiveWindow = (overrides?: Partial<MaintenanceWindow>): MaintenanceWindow => {
	const now = Date.now();
	return makeWindow({
		start: new Date(now - 60_000).toISOString(),
		end: new Date(now + 60_000).toISOString(),
		...overrides,
	});
};

const defaultCreateParams = {
	teamId: "team-1",
	monitorIDs: ["mon-1", "mon-2"],
	name: "Scheduled Maintenance",
	active: true,
	duration: 60,
	durationUnit: "minutes" as const,
	repeat: 0,
	start: "2026-04-10T02:00:00Z",
	end: "2026-04-10T03:00:00Z",
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("MaintenanceWindowService", () => {
	describe("serviceName", () => {
		it("returns maintenanceWindowService from static property", () => {
			expect(MaintenanceWindowService.SERVICE_NAME).toBe("maintenanceWindowService");
		});

		it("returns maintenanceWindowService from instance getter", () => {
			const { service } = createService();
			expect(service.serviceName).toBe("maintenanceWindowService");
		});
	});

	// ── createMaintenanceWindow ──────────────────────────────────────────────

	describe("createMaintenanceWindow", () => {
		it("creates a single maintenance window covering all monitor IDs", async () => {
			const { service, maintenanceWindowsRepository } = createService();

			await service.createMaintenanceWindow(defaultCreateParams);

			expect(maintenanceWindowsRepository.create).toHaveBeenCalledTimes(1);
			expect(maintenanceWindowsRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					teamId: "team-1",
					monitorIds: ["mon-1", "mon-2"],
					name: "Scheduled Maintenance",
					active: true,
					duration: 60,
					durationUnit: "minutes",
					repeat: 0,
					start: "2026-04-10T02:00:00Z",
					end: "2026-04-10T03:00:00Z",
				})
			);
		});

		it("verifies monitor ownership via findByIds", async () => {
			const { service, monitorsRepository } = createService();

			await service.createMaintenanceWindow(defaultCreateParams);

			expect(monitorsRepository.findByIds).toHaveBeenCalledWith(["mon-1", "mon-2"]);
		});

		it("throws 403 when a monitor belongs to a different team", async () => {
			const monitorsRepository = createMonitorsRepo();
			(monitorsRepository.findByIds as jest.Mock).mockResolvedValue([
				{ id: "mon-1", teamId: "team-1" },
				{ id: "mon-2", teamId: "team-other" },
			]);
			const { service, maintenanceWindowsRepository } = createService({ monitorsRepository });

			await expect(service.createMaintenanceWindow(defaultCreateParams)).rejects.toThrow(
				"Unauthorized to create maintenance window for one or more monitors"
			);
			expect(maintenanceWindowsRepository.create).not.toHaveBeenCalled();
		});

		it("does not throw when all monitors belong to the team", async () => {
			const { service } = createService();

			await expect(service.createMaintenanceWindow(defaultCreateParams)).resolves.toBeUndefined();
		});

		it("passes a single-element monitorIds array when only one monitor is provided", async () => {
			const { service, maintenanceWindowsRepository } = createService();

			await service.createMaintenanceWindow({ ...defaultCreateParams, monitorIDs: ["mon-1"] });

			expect(maintenanceWindowsRepository.create).toHaveBeenCalledTimes(1);
			expect(maintenanceWindowsRepository.create).toHaveBeenCalledWith(expect.objectContaining({ monitorIds: ["mon-1"] }));
		});
	});

	// ── getMaintenanceWindowById ─────────────────────────────────────────────

	describe("getMaintenanceWindowById", () => {
		it("delegates to repository with id and teamId", async () => {
			const expected = makeWindow();
			const { service, maintenanceWindowsRepository } = createService();
			(maintenanceWindowsRepository.findById as jest.Mock).mockResolvedValue(expected);

			const result = await service.getMaintenanceWindowById({ id: "mw-1", teamId: "team-1" });

			expect(result).toBe(expected);
			expect(maintenanceWindowsRepository.findById).toHaveBeenCalledWith("mw-1", "team-1");
		});
	});

	// ── getMaintenanceWindowsByTeamId ────────────────────────────────────────

	describe("getMaintenanceWindowsByTeamId", () => {
		it("returns windows and count", async () => {
			const windows = [makeWindow()];
			const { service, maintenanceWindowsRepository } = createService();
			(maintenanceWindowsRepository.findByTeamId as jest.Mock).mockResolvedValue(windows);
			(maintenanceWindowsRepository.countByTeamId as jest.Mock).mockResolvedValue(1);

			const result = await service.getMaintenanceWindowsByTeamId({ teamId: "team-1" });

			expect(result).toEqual({ maintenanceWindows: windows, maintenanceWindowCount: 1 });
		});

		it("defaults page to 0 and rowsPerPage to 10 when not provided", async () => {
			const { service, maintenanceWindowsRepository } = createService();

			await service.getMaintenanceWindowsByTeamId({ teamId: "team-1" });

			expect(maintenanceWindowsRepository.findByTeamId).toHaveBeenCalledWith("team-1", 0, 10, undefined, undefined, undefined);
		});

		it("passes pagination and filter parameters through", async () => {
			const { service, maintenanceWindowsRepository } = createService();

			await service.getMaintenanceWindowsByTeamId({
				teamId: "team-1",
				active: true,
				page: 2,
				rowsPerPage: 5,
				field: "name",
				order: "asc",
			});

			expect(maintenanceWindowsRepository.findByTeamId).toHaveBeenCalledWith("team-1", 2, 5, "name", "asc", true);
			expect(maintenanceWindowsRepository.countByTeamId).toHaveBeenCalledWith("team-1", true);
		});
	});

	// ── getMaintenanceWindowsByMonitorId ─────────────────────────────────────

	describe("getMaintenanceWindowsByMonitorId", () => {
		it("delegates to repository with monitorId and teamId", async () => {
			const windows = [makeWindow()];
			const { service, maintenanceWindowsRepository } = createService();
			(maintenanceWindowsRepository.findByMonitorId as jest.Mock).mockResolvedValue(windows);

			const result = await service.getMaintenanceWindowsByMonitorId({ monitorId: "mon-1", teamId: "team-1" });

			expect(result).toBe(windows);
			expect(maintenanceWindowsRepository.findByMonitorId).toHaveBeenCalledWith("mon-1", "team-1");
		});
	});

	// ── deleteMaintenanceWindow ──────────────────────────────────────────────

	describe("deleteMaintenanceWindow", () => {
		it("delegates to repository and returns deleted window", async () => {
			const deleted = makeWindow();
			const { service, maintenanceWindowsRepository } = createService();
			(maintenanceWindowsRepository.deleteById as jest.Mock).mockResolvedValue(deleted);

			const result = await service.deleteMaintenanceWindow({ id: "mw-1", teamId: "team-1" });

			expect(result).toBe(deleted);
			expect(maintenanceWindowsRepository.deleteById).toHaveBeenCalledWith("mw-1", "team-1");
		});

		it("does not touch monitor status when deleting an inactive window", async () => {
			// default fixture has past dates → inactive
			const { service, monitorsRepository, maintenanceWindowsRepository } = createService();

			await service.deleteMaintenanceWindow({ id: "mw-1", teamId: "team-1" });

			expect(monitorsRepository.updateByIds).not.toHaveBeenCalled();
			expect(maintenanceWindowsRepository.findByMonitorIds).not.toHaveBeenCalled();
		});

		it("flips covered monitors to initializing when deleting an active window", async () => {
			const maintenanceWindowsRepository = createMaintenanceWindowsRepo();
			(maintenanceWindowsRepository.deleteById as jest.Mock).mockResolvedValue(makeActiveWindow({ monitorIds: ["mon-1", "mon-2"] }));
			const { service, monitorsRepository } = createService({ maintenanceWindowsRepository });

			await service.deleteMaintenanceWindow({ id: "mw-1", teamId: "team-1" });

			expect(monitorsRepository.updateByIds).toHaveBeenCalledTimes(1);
			expect(monitorsRepository.updateByIds).toHaveBeenCalledWith(["mon-1", "mon-2"], "team-1", { status: "initializing" });
		});

		it("excludes the deleted window from the overlap check", async () => {
			const maintenanceWindowsRepository = createMaintenanceWindowsRepo();
			(maintenanceWindowsRepository.deleteById as jest.Mock).mockResolvedValue(makeActiveWindow({ monitorIds: ["mon-1"] }));
			const { service } = createService({ maintenanceWindowsRepository });

			await service.deleteMaintenanceWindow({ id: "mw-1", teamId: "team-1" });

			expect(maintenanceWindowsRepository.findByMonitorIds).toHaveBeenCalledWith(["mon-1"], "team-1", "mw-1");
		});

		it("does not flip a monitor still covered by another active window", async () => {
			const maintenanceWindowsRepository = createMaintenanceWindowsRepo();
			(maintenanceWindowsRepository.deleteById as jest.Mock).mockResolvedValue(makeActiveWindow({ monitorIds: ["mon-1", "mon-2"] }));
			(maintenanceWindowsRepository.findByMonitorIds as jest.Mock).mockResolvedValue([makeActiveWindow({ id: "mw-2", monitorIds: ["mon-2"] })]);
			const { service, monitorsRepository } = createService({ maintenanceWindowsRepository });

			await service.deleteMaintenanceWindow({ id: "mw-1", teamId: "team-1" });

			expect(monitorsRepository.updateByIds).toHaveBeenCalledTimes(1);
			expect(monitorsRepository.updateByIds).toHaveBeenCalledWith(["mon-1"], "team-1", { status: "initializing" });
		});
	});

	// ── editMaintenanceWindow ────────────────────────────────────────────────

	describe("editMaintenanceWindow", () => {
		it("delegates to repository with id, teamId, and body", async () => {
			const updated = makeWindow({ name: "Updated Name" });
			const { service, maintenanceWindowsRepository } = createService();
			(maintenanceWindowsRepository.updateById as jest.Mock).mockResolvedValue(updated);

			const result = await service.editMaintenanceWindow({ id: "mw-1", teamId: "team-1", body: { name: "Updated Name" } });

			expect(result).toBe(updated);
			expect(maintenanceWindowsRepository.updateById).toHaveBeenCalledWith("mw-1", "team-1", { name: "Updated Name" });
		});

		it("passes partial body fields through", async () => {
			const { service, maintenanceWindowsRepository } = createService();

			await service.editMaintenanceWindow({
				id: "mw-1",
				teamId: "team-1",
				body: { active: false, repeat: 3600000 },
			});

			expect(maintenanceWindowsRepository.updateById).toHaveBeenCalledWith("mw-1", "team-1", { active: false, repeat: 3600000 });
		});

		it("maps the monitors body field to monitorIds when calling the repository", async () => {
			const { service, maintenanceWindowsRepository } = createService();

			await service.editMaintenanceWindow({
				id: "mw-1",
				teamId: "team-1",
				body: { monitors: ["mon-1", "mon-2"] },
			});

			expect(maintenanceWindowsRepository.updateById).toHaveBeenCalledWith("mw-1", "team-1", { monitorIds: ["mon-1", "mon-2"] });
		});

		it("verifies monitor ownership when monitors is in the body", async () => {
			const { service, monitorsRepository } = createService();

			await service.editMaintenanceWindow({
				id: "mw-1",
				teamId: "team-1",
				body: { monitors: ["mon-1", "mon-2"] },
			});

			expect(monitorsRepository.findByIds).toHaveBeenCalledWith(["mon-1", "mon-2"]);
		});

		it("throws 403 when a new monitor belongs to a different team", async () => {
			const monitorsRepository = createMonitorsRepo();
			(monitorsRepository.findByIds as jest.Mock).mockResolvedValue([
				{ id: "mon-1", teamId: "team-1" },
				{ id: "mon-2", teamId: "team-other" },
			]);
			const { service, maintenanceWindowsRepository } = createService({ monitorsRepository });

			await expect(
				service.editMaintenanceWindow({
					id: "mw-1",
					teamId: "team-1",
					body: { monitors: ["mon-1", "mon-2"] },
				})
			).rejects.toThrow("Unauthorized to edit maintenance window for one or more monitors");
			expect(maintenanceWindowsRepository.updateById).not.toHaveBeenCalled();
		});

		it("does not call findByIds when monitors is not in the body", async () => {
			const { service, monitorsRepository } = createService();

			await service.editMaintenanceWindow({
				id: "mw-1",
				teamId: "team-1",
				body: { name: "Updated Name" },
			});

			expect(monitorsRepository.findByIds).not.toHaveBeenCalled();
		});

		// ── transitions ──────────────────────────────────────────────────

		it("does not touch monitor status when window was inactive and stays inactive", async () => {
			// default fixture: start/end in 2026-04-10 (past) → inactive
			const { service, monitorsRepository } = createService();

			await service.editMaintenanceWindow({
				id: "mw-1",
				teamId: "team-1",
				body: { name: "Updated Name" },
			});

			expect(monitorsRepository.updateByIds).not.toHaveBeenCalled();
		});

		it("sets all monitors to maintenance when window transitions inactive → active", async () => {
			const maintenanceWindowsRepository = createMaintenanceWindowsRepo();
			(maintenanceWindowsRepository.findById as jest.Mock).mockResolvedValue(makeWindow({ monitorIds: ["mon-1", "mon-2"] }));
			(maintenanceWindowsRepository.updateById as jest.Mock).mockResolvedValue(makeActiveWindow({ monitorIds: ["mon-1", "mon-2"] }));
			const { service, monitorsRepository } = createService({ maintenanceWindowsRepository });

			await service.editMaintenanceWindow({
				id: "mw-1",
				teamId: "team-1",
				body: { start: new Date(Date.now() - 60_000).toISOString() },
			});

			expect(monitorsRepository.updateByIds).toHaveBeenCalledTimes(1);
			expect(monitorsRepository.updateByIds).toHaveBeenCalledWith(["mon-1", "mon-2"], "team-1", { status: "maintenance" });
		});

		it("sets all monitors to initializing when window transitions active → inactive", async () => {
			const maintenanceWindowsRepository = createMaintenanceWindowsRepo();
			(maintenanceWindowsRepository.findById as jest.Mock).mockResolvedValue(makeActiveWindow({ monitorIds: ["mon-1", "mon-2"] }));
			(maintenanceWindowsRepository.updateById as jest.Mock).mockResolvedValue(makeActiveWindow({ monitorIds: ["mon-1", "mon-2"], active: false }));
			const { service, monitorsRepository } = createService({ maintenanceWindowsRepository });

			await service.editMaintenanceWindow({
				id: "mw-1",
				teamId: "team-1",
				body: { active: false },
			});

			expect(monitorsRepository.updateByIds).toHaveBeenCalledTimes(1);
			expect(monitorsRepository.updateByIds).toHaveBeenCalledWith(["mon-1", "mon-2"], "team-1", { status: "initializing" });
		});

		it("flips only newly added monitors to maintenance when window stays active", async () => {
			const maintenanceWindowsRepository = createMaintenanceWindowsRepo();
			(maintenanceWindowsRepository.findById as jest.Mock).mockResolvedValue(makeActiveWindow({ monitorIds: ["mon-1"] }));
			(maintenanceWindowsRepository.updateById as jest.Mock).mockResolvedValue(makeActiveWindow({ monitorIds: ["mon-1", "mon-2"] }));
			const { service, monitorsRepository } = createService({ maintenanceWindowsRepository });

			await service.editMaintenanceWindow({
				id: "mw-1",
				teamId: "team-1",
				body: { monitors: ["mon-1", "mon-2"] },
			});

			expect(monitorsRepository.updateByIds).toHaveBeenCalledTimes(1);
			expect(monitorsRepository.updateByIds).toHaveBeenCalledWith(["mon-2"], "team-1", { status: "maintenance" });
		});

		it("flips only removed monitors to initializing when window stays active", async () => {
			const maintenanceWindowsRepository = createMaintenanceWindowsRepo();
			(maintenanceWindowsRepository.findById as jest.Mock).mockResolvedValue(makeActiveWindow({ monitorIds: ["mon-1", "mon-2"] }));
			(maintenanceWindowsRepository.updateById as jest.Mock).mockResolvedValue(makeActiveWindow({ monitorIds: ["mon-1"] }));
			const { service, monitorsRepository } = createService({ maintenanceWindowsRepository });

			await service.editMaintenanceWindow({
				id: "mw-1",
				teamId: "team-1",
				body: { monitors: ["mon-1"] },
			});

			expect(monitorsRepository.updateByIds).toHaveBeenCalledTimes(1);
			expect(monitorsRepository.updateByIds).toHaveBeenCalledWith(["mon-2"], "team-1", { status: "initializing" });
		});

		it("makes no monitor updates when window stays active and monitor set is unchanged", async () => {
			const maintenanceWindowsRepository = createMaintenanceWindowsRepo();
			(maintenanceWindowsRepository.findById as jest.Mock).mockResolvedValue(makeActiveWindow({ monitorIds: ["mon-1", "mon-2"] }));
			(maintenanceWindowsRepository.updateById as jest.Mock).mockResolvedValue(makeActiveWindow({ monitorIds: ["mon-1", "mon-2"], name: "Renamed" }));
			const { service, monitorsRepository } = createService({ maintenanceWindowsRepository });

			await service.editMaintenanceWindow({
				id: "mw-1",
				teamId: "team-1",
				body: { name: "Renamed" },
			});

			expect(monitorsRepository.updateByIds).not.toHaveBeenCalled();
		});

		it("does not flip a leaving monitor to initializing if another active window still covers it", async () => {
			const maintenanceWindowsRepository = createMaintenanceWindowsRepo();
			(maintenanceWindowsRepository.findById as jest.Mock).mockResolvedValue(makeActiveWindow({ monitorIds: ["mon-1", "mon-2"] }));
			(maintenanceWindowsRepository.updateById as jest.Mock).mockResolvedValue(makeActiveWindow({ monitorIds: ["mon-1", "mon-2"], active: false }));
			(maintenanceWindowsRepository.findByMonitorIds as jest.Mock).mockResolvedValue([makeActiveWindow({ id: "mw-2", monitorIds: ["mon-2"] })]);
			const { service, monitorsRepository } = createService({ maintenanceWindowsRepository });

			await service.editMaintenanceWindow({
				id: "mw-1",
				teamId: "team-1",
				body: { active: false },
			});

			expect(monitorsRepository.updateByIds).toHaveBeenCalledTimes(1);
			expect(monitorsRepository.updateByIds).toHaveBeenCalledWith(["mon-1"], "team-1", { status: "initializing" });
		});

		it("excludes the current window from the overlap check", async () => {
			const maintenanceWindowsRepository = createMaintenanceWindowsRepo();
			(maintenanceWindowsRepository.findById as jest.Mock).mockResolvedValue(makeActiveWindow({ monitorIds: ["mon-1"] }));
			(maintenanceWindowsRepository.updateById as jest.Mock).mockResolvedValue(makeActiveWindow({ monitorIds: ["mon-1"], active: false }));
			const { service } = createService({ maintenanceWindowsRepository });

			await service.editMaintenanceWindow({
				id: "mw-1",
				teamId: "team-1",
				body: { active: false },
			});

			expect(maintenanceWindowsRepository.findByMonitorIds).toHaveBeenCalledWith(["mon-1"], "team-1", "mw-1");
		});

		it("flips a leaving monitor to initializing if other windows covering it are inactive", async () => {
			const maintenanceWindowsRepository = createMaintenanceWindowsRepo();
			(maintenanceWindowsRepository.findById as jest.Mock).mockResolvedValue(makeActiveWindow({ monitorIds: ["mon-1"] }));
			(maintenanceWindowsRepository.updateById as jest.Mock).mockResolvedValue(makeActiveWindow({ monitorIds: ["mon-1"], active: false }));
			(maintenanceWindowsRepository.findByMonitorIds as jest.Mock).mockResolvedValue([
				makeWindow({ id: "mw-2", monitorIds: ["mon-1"], active: false }),
			]);
			const { service, monitorsRepository } = createService({ maintenanceWindowsRepository });

			await service.editMaintenanceWindow({
				id: "mw-1",
				teamId: "team-1",
				body: { active: false },
			});

			expect(monitorsRepository.updateByIds).toHaveBeenCalledWith(["mon-1"], "team-1", { status: "initializing" });
		});
	});
});
