import { describe, expect, it, beforeEach } from "@jest/globals";
import { createHeartbeatTestHarness, makeMonitor, type HeartbeatTestHarness } from "../helpers/heartbeatTestHarness.ts";

describe("Heartbeat job: down detection", () => {
	let h: HeartbeatTestHarness;

	beforeEach(() => {
		h = createHeartbeatTestHarness();
	});

	it("transitions monitor to down and creates incident after threshold failures", async () => {
		// Monitor starts with full passing window: [true, true, true, true, true]
		const monitor = makeMonitor();
		h.monitorsRepo.seed(monitor);

		// 2 failures: window = [true, true, true, false, false] = 40% < 60%
		h.setNextResponse(false, 503);
		await h.heartbeatJob(monitor);
		await h.heartbeatJob(monitor);

		let storedMonitor = await h.monitorsRepo.findById("mon-1", "team-1");
		expect(storedMonitor.status).toBe("up");
		expect(h.incidentsRepo.getAll()).toHaveLength(0);

		// 3rd failure: window = [true, true, false, false, false] = 60% >= 60%
		await h.heartbeatJob(monitor);

		storedMonitor = await h.monitorsRepo.findById("mon-1", "team-1");
		expect(storedMonitor.status).toBe("down");

		// Incident should have been created
		const incidents = h.incidentsRepo.getAll();
		expect(incidents).toHaveLength(1);
		expect(incidents[0].monitorId).toBe("mon-1");
		expect(incidents[0].status).toBe(true);
		expect(incidents[0].statusCode).toBe(503);

		// Notification should have been triggered
		expect(h.notificationsService.handleNotifications).toHaveBeenCalled();
	});

	it("does not create duplicate incidents on continued failures", async () => {
		const monitor = makeMonitor();
		h.monitorsRepo.seed(monitor);

		h.setNextResponse(false, 500);

		// 3 failures trigger down, 4 more continue failing
		for (let i = 0; i < 7; i++) {
			await h.heartbeatJob(monitor);
		}

		// Only one incident despite 7 heartbeats
		expect(h.incidentsRepo.getAll()).toHaveLength(1);
	});

	it("stays up when failures are below threshold", async () => {
		const monitor = makeMonitor();
		h.monitorsRepo.seed(monitor);

		// 2 failures: window = [true, true, true, false, false] = 40% < 60%
		h.setNextResponse(false, 500);
		await h.heartbeatJob(monitor);
		await h.heartbeatJob(monitor);

		// 3 passes: window = [false, false, true, true, true] = 40% < 60%
		h.setNextResponse(true, 200);
		await h.heartbeatJob(monitor);
		await h.heartbeatJob(monitor);
		await h.heartbeatJob(monitor);

		const storedMonitor = await h.monitorsRepo.findById("mon-1", "team-1");
		expect(storedMonitor.status).toBe("up");
		expect(h.incidentsRepo.getAll()).toHaveLength(0);
		// Regression guard for #3438: a sub-threshold blip must produce NO notification
		// dispatches. Before PR #3505, a failing check below threshold silently wrote
		// status="down" and the next passing check fired a spurious "Recovered" event.
		expect(h.notificationsService.handleNotifications).not.toHaveBeenCalled();
	});

	it("fires zero notifications on a sub-threshold blip (regression #3438)", async () => {
		// Dedicated end-to-end guard for the #3438 bug. Distinct from "stays up when
		// failures are below threshold" because it pins the notification-dispatch
		// contract independently of status/incident assertions, so a future refactor
		// that reintroduces the silent-down-write can't sneak past by happening to
		// leave status and incidents in the right shape.
		const monitor = makeMonitor();
		h.monitorsRepo.seed(monitor);

		// Failing check below threshold (window [t,t,t,t,f], 20%)
		h.setNextResponse(false, 503);
		await h.heartbeatJob(monitor);

		// Passing check — pre-fix, this is where the spurious "Recovered" fired
		h.setNextResponse(true, 200);
		await h.heartbeatJob(monitor);

		expect((await h.monitorsRepo.findById("mon-1", "team-1")).status).toBe("up");
		expect(h.incidentsRepo.getAll()).toHaveLength(0);
		expect(h.notificationsService.handleNotifications).not.toHaveBeenCalled();
	});
});
