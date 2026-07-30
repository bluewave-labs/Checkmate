import { describe, expect, it, jest } from "@jest/globals";
import { MaintenanceWindowService } from "../../../src/domain/maintenance-windows/maintenance-window.service.ts";
import type { IMaintenanceWindowsRepository } from "../../../src/domain/maintenance-windows/maintenance-window.repository.interface.ts";
import type { IMonitorsRepository } from "../../../src/domain/monitors/monitor.repository.interface.ts";
import type { IJobsRepository } from "../../../src/domain/jobs/job.repository.interface.ts";
import type { IJobScheduler } from "../../../src/worker/worker.interface.ts";
import type { MaintenanceWindow } from "../../../src/domain/maintenance-windows/maintenance-window.type.ts";

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

const createJobsRepo = () =>
	({
		markMonitorsDue: jest.fn().mockResolvedValue(0),
	}) as unknown as jest.Mocked<IJobsRepository>;

const createWorker = () =>
	({
		wake: jest.fn(),
	}) as unknown as jest.Mocked<IJobScheduler>;

const createService = (overrides?: {
	monitorsRepository?: ReturnType<typeof createMonitorsRepo>;
	maintenanceWindowsRepository?: ReturnType<typeof createMaintenanceWindowsRepo>;
	jobsRepository?: ReturnType<typeof createJobsRepo>;
	worker?: ReturnType<typeof createWorker>;
}) => {
	const monitorsRepository = overrides?.monitorsRepository ?? createMonitorsRepo();
	const maintenanceWindowsRepository = overrides?.maintenanceWindowsRepository ?? createMaintenanceWindowsRepo();
	const jobsRepository = overrides?.jobsRepository ?? createJobsRepo();
	const worker = overrides?.worker ?? createWorker();
	const service = new MaintenanceWindowService({ monitorsRepository, maintenanceWindowsRepository, jobsRepository, scheduler: worker });
	return { service, monitorsRepository, maintenanceWindowsRepository, jobsRepository, worker };
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

		it("flips monitors to maintenance when the created window is active", async () => {
			const maintenanceWindowsRepository = createMaintenanceWindowsRepo();
			(maintenanceWindowsRepository.create as jest.Mock).mockResolvedValue(makeActiveWindow({ monitorIds: ["mon-1", "mon-2"] }));
			const { service, monitorsRepository } = createService({ maintenanceWindowsRepository });

			await service.createMaintenanceWindow(defaultCreateParams);

			expect(monitorsRepository.updateByIds).toHaveBeenCalledTimes(1);
			expect(monitorsRepository.updateByIds).toHaveBeenCalledWith(["mon-1", "mon-2"], "team-1", { status: "maintenance" }, ["paused"]);
		});

		it("does not touch monitor status when the created window is inactive", async () => {
			// default mock returns makeWindow() with past dates → inactive
			const { service, monitorsRepository } = createService();

			await service.createMaintenanceWindow(defaultCreateParams);

			expect(monitorsRepository.updateByIds).not.toHaveBeenCalled();
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
			const { service, monitorsRepository, jobsRepository, worker } = createService({ maintenanceWindowsRepository });

			await service.deleteMaintenanceWindow({ id: "mw-1", teamId: "team-1" });

			expect(monitorsRepository.updateByIds).toHaveBeenCalledTimes(1);
			expect(monitorsRepository.updateByIds).toHaveBeenCalledWith(["mon-1", "mon-2"], "team-1", { status: "initializing" }, ["paused"]);
			// Monitors leaving maintenance are re-armed to run soon instead of waiting out the interval
			expect(jobsRepository.markMonitorsDue).toHaveBeenCalledWith(["mon-1", "mon-2"], expect.any(Number));
			// ...and the idle loops are woken so the re-armed jobs run promptly
			expect(worker.wake).toHaveBeenCalledWith("check");
			expect(worker.wake).toHaveBeenCalledWith("geo-check");
		});

		it("does not wake the loops when no monitor leaves maintenance", async () => {
			const maintenanceWindowsRepository = createMaintenanceWindowsRepo();
			(maintenanceWindowsRepository.deleteById as jest.Mock).mockResolvedValue(makeWindow({ active: false, monitorIds: ["mon-1"] }));
			const { service, worker } = createService({ maintenanceWindowsRepository });

			await service.deleteMaintenanceWindow({ id: "mw-1", teamId: "team-1" });

			expect(worker.wake).not.toHaveBeenCalled();
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
			expect(monitorsRepository.updateByIds).toHaveBeenCalledWith(["mon-1"], "team-1", { status: "initializing" }, ["paused"]);
		});

		it("skips the overlap lookup when an active window with no monitorIds is deleted", async () => {
			const maintenanceWindowsRepository = createMaintenanceWindowsRepo();
			(maintenanceWindowsRepository.deleteById as jest.Mock).mockResolvedValue(makeActiveWindow({ monitorIds: [] }));
			const { service, monitorsRepository } = createService({ maintenanceWindowsRepository });

			await service.deleteMaintenanceWindow({ id: "mw-1", teamId: "team-1" });

			expect(maintenanceWindowsRepository.findByMonitorIds).not.toHaveBeenCalled();
			expect(monitorsRepository.updateByIds).not.toHaveBeenCalled();
		});

		it("ignores monitorIds in overlapping windows that are outside the leaving set", async () => {
			const maintenanceWindowsRepository = createMaintenanceWindowsRepo();
			(maintenanceWindowsRepository.deleteById as jest.Mock).mockResolvedValue(makeActiveWindow({ monitorIds: ["mon-1"] }));
			// overlapping window covers mon-1 (in the leaving set) plus mon-99 (unrelated, must be skipped)
			(maintenanceWindowsRepository.findByMonitorIds as jest.Mock).mockResolvedValue([
				makeActiveWindow({ id: "mw-2", monitorIds: ["mon-1", "mon-99"] }),
			]);
			const { service, monitorsRepository } = createService({ maintenanceWindowsRepository });

			await service.deleteMaintenanceWindow({ id: "mw-1", teamId: "team-1" });

			// mon-1 is still covered by mw-2; mon-99 must not leak into the update
			expect(monitorsRepository.updateByIds).not.toHaveBeenCalled();
		});

		it("makes no monitor updates when every leaving monitor is still covered by another active window", async () => {
			const maintenanceWindowsRepository = createMaintenanceWindowsRepo();
			(maintenanceWindowsRepository.deleteById as jest.Mock).mockResolvedValue(makeActiveWindow({ monitorIds: ["mon-1", "mon-2"] }));
			(maintenanceWindowsRepository.findByMonitorIds as jest.Mock).mockResolvedValue([
				makeActiveWindow({ id: "mw-2", monitorIds: ["mon-1", "mon-2"] }),
			]);
			const { service, monitorsRepository } = createService({ maintenanceWindowsRepository });

			await service.deleteMaintenanceWindow({ id: "mw-1", teamId: "team-1" });

			expect(monitorsRepository.updateByIds).not.toHaveBeenCalled();
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
			expect(monitorsRepository.updateByIds).toHaveBeenCalledWith(["mon-1", "mon-2"], "team-1", { status: "maintenance" }, ["paused"]);
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
			expect(monitorsRepository.updateByIds).toHaveBeenCalledWith(["mon-1", "mon-2"], "team-1", { status: "initializing" }, ["paused"]);
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
			expect(monitorsRepository.updateByIds).toHaveBeenCalledWith(["mon-2"], "team-1", { status: "maintenance" }, ["paused"]);
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
			expect(monitorsRepository.updateByIds).toHaveBeenCalledWith(["mon-2"], "team-1", { status: "initializing" }, ["paused"]);
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
			expect(monitorsRepository.updateByIds).toHaveBeenCalledWith(["mon-1"], "team-1", { status: "initializing" }, ["paused"]);
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

			expect(monitorsRepository.updateByIds).toHaveBeenCalledWith(["mon-1"], "team-1", { status: "initializing" }, ["paused"]);
		});
	});
});
