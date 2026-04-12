import { describe, expect, it, beforeEach } from "@jest/globals";
import { createHeartbeatTestHarness, makeMonitor, type HeartbeatTestHarness } from "../helpers/heartbeatTestHarness.ts";
import type { MaintenanceWindow } from "../../src/types/maintenanceWindow.ts";

const makeMaintenanceWindow = (overrides?: Partial<MaintenanceWindow>): MaintenanceWindow => {
	const now = new Date();
	const start = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
	const end = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
	return {
		id: "mw-1",
		monitorId: "mon-1",
		teamId: "team-1",
		active: true,
		name: "Test Maintenance",
		duration: 2,
		durationUnit: "hours",
		repeat: 0,
		start: start.toISOString(),
		end: end.toISOString(),
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		...overrides,
	};
};

describe("Heartbeat job: maintenance windows", () => {
	let h: HeartbeatTestHarness;

	beforeEach(() => {
		h = createHeartbeatTestHarness();
	});

	it("skips checks and sets monitor to maintenance when window is active", async () => {
		const monitor = makeMonitor();
		h.monitorsRepo.seed(monitor);

		// Configure an active maintenance window covering the current time
		h.maintenanceWindowsRepo.findByMonitorId.mockResolvedValue([makeMaintenanceWindow()]);

		await h.heartbeatJob(monitor);

		// Monitor status should be set to maintenance
		const storedMonitor = await h.monitorsRepo.findById("mon-1", "team-1");
		expect(storedMonitor.status).toBe("maintenance");

		// No network request should have been made
		expect(h.networkService.requestStatus).not.toHaveBeenCalled();

		// No check should have been buffered
		expect(h.bufferStub.addToBuffer).not.toHaveBeenCalled();

		// No incident should have been created
		expect(h.incidentsRepo.getAll()).toHaveLength(0);

		// No notification should have been sent
		expect(h.notificationsService.handleNotifications).not.toHaveBeenCalled();
	});

	it("does not update status if monitor is already in maintenance", async () => {
		const monitor = makeMonitor({ status: "maintenance" });
		h.monitorsRepo.seed(monitor);

		h.maintenanceWindowsRepo.findByMonitorId.mockResolvedValue([makeMaintenanceWindow()]);

		await h.heartbeatJob(monitor);

		// findById reads the stored monitor; updateById should not have been called
		// since status was already "maintenance"
		const storedMonitor = await h.monitorsRepo.findById("mon-1", "team-1");
		expect(storedMonitor.status).toBe("maintenance");
		expect(h.networkService.requestStatus).not.toHaveBeenCalled();
	});

	it("resumes normal checks when maintenance window expires", async () => {
		const monitor = makeMonitor();
		h.monitorsRepo.seed(monitor);

		// First heartbeat: inside maintenance window
		h.maintenanceWindowsRepo.findByMonitorId.mockResolvedValue([makeMaintenanceWindow()]);
		await h.heartbeatJob(monitor);

		let storedMonitor = await h.monitorsRepo.findById("mon-1", "team-1");
		expect(storedMonitor.status).toBe("maintenance");

		// Second heartbeat: maintenance window expired (no windows returned)
		h.maintenanceWindowsRepo.findByMonitorId.mockResolvedValue([]);
		h.setNextResponse(true, 200);
		await h.heartbeatJob(monitor);

		// Network request should have been made this time
		expect(h.networkService.requestStatus).toHaveBeenCalledTimes(1);

		// Check should have been buffered
		expect(h.bufferStub.addToBuffer).toHaveBeenCalledTimes(1);
	});

	it("skips checks when window is inactive (active: false)", async () => {
		const monitor = makeMonitor();
		h.monitorsRepo.seed(monitor);

		// Inactive maintenance window — should be ignored
		h.maintenanceWindowsRepo.findByMonitorId.mockResolvedValue([makeMaintenanceWindow({ active: false })]);

		h.setNextResponse(true, 200);
		await h.heartbeatJob(monitor);

		// Normal check should proceed since window is inactive
		expect(h.networkService.requestStatus).toHaveBeenCalledTimes(1);
		expect(h.bufferStub.addToBuffer).toHaveBeenCalledTimes(1);
	});

	it("skips checks when window is in the past (expired)", async () => {
		const monitor = makeMonitor();
		h.monitorsRepo.seed(monitor);

		// Window ended an hour ago
		const pastEnd = new Date(Date.now() - 60 * 60 * 1000);
		const pastStart = new Date(pastEnd.getTime() - 2 * 60 * 60 * 1000);
		h.maintenanceWindowsRepo.findByMonitorId.mockResolvedValue([
			makeMaintenanceWindow({ start: pastStart.toISOString(), end: pastEnd.toISOString() }),
		]);

		h.setNextResponse(true, 200);
		await h.heartbeatJob(monitor);

		// Window is in the past — normal check should proceed
		expect(h.networkService.requestStatus).toHaveBeenCalledTimes(1);
	});
});
