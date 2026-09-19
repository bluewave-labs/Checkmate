import { describe, expect, it, beforeEach } from "@jest/globals";
import { createHeartbeatTestHarness, makeMonitor, type HeartbeatTestHarness } from "../helpers/heartbeatTestHarness.ts";
import { NETWORK_ERROR } from "../../src/types/network.ts";

// Egress is only consulted for transport failures, so these heartbeats fail with the network-error
// sentinel (timeout / connection refused) rather than an HTTP status code.

describe("Heartbeat job: degraded egress", () => {
	let h: HeartbeatTestHarness;

	beforeEach(() => {
		h = createHeartbeatTestHarness();
	});

	it("records failing checks as degraded without changing monitor status, opening an incident or notifying", async () => {
		const monitor = makeMonitor();
		h.monitorsRepo.seed(monitor);

		// Enough failures to cross the 60% threshold if they were counted
		h.setEgressStatus("degraded");
		h.setNextResponse(false, NETWORK_ERROR);
		for (let i = 0; i < 3; i++) {
			await h.heartbeatJob(monitor);
		}

		// Every check was buffered, flagged, so the repository can exclude it from uptime
		expect(h.egressService.assessAfterFailure).toHaveBeenCalledTimes(3);
		expect(h.bufferStub.addToBuffer).toHaveBeenCalledTimes(3);
		for (const [check] of h.bufferStub.addToBuffer.mock.calls) {
			expect(check).toMatchObject({ status: false, egressStatus: "degraded" });
		}

		// Nothing downstream moved
		const storedMonitor = await h.monitorsRepo.findById("mon-1", "team-1");
		expect(storedMonitor.status).toBe("up");
		// The window is cleared once as the spell starts, as entering a maintenance window does.
		expect(storedMonitor.statusWindow).toEqual([]);
		expect(h.incidentsRepo.getAll()).toHaveLength(0);
		expect(h.notificationsService.handleNotifications).not.toHaveBeenCalled();
	});

	it("does not fire a spurious recovery once egress returns", async () => {
		const monitor = makeMonitor();
		h.monitorsRepo.seed(monitor);

		h.setEgressStatus("degraded");
		h.setNextResponse(false, NETWORK_ERROR);
		for (let i = 0; i < 3; i++) {
			await h.heartbeatJob(monitor);
		}

		// Egress is back and the target is fine
		h.setEgressStatus(null);
		h.setNextResponse(true, 200);
		await h.heartbeatJob(monitor);

		expect((await h.monitorsRepo.findById("mon-1", "team-1")).status).toBe("up");
		expect(h.incidentsRepo.getAll()).toHaveLength(0);
		expect(h.notificationsService.handleNotifications).not.toHaveBeenCalled();
	});

	it("detects down at the normal threshold when the egress check is disabled", async () => {
		const monitor = makeMonitor();
		h.monitorsRepo.seed(monitor);

		h.setEgressStatus(null);
		h.setNextResponse(false, NETWORK_ERROR);
		for (let i = 0; i < 3; i++) {
			await h.heartbeatJob(monitor);
		}

		expect(h.egressService.assessAfterFailure).toHaveBeenCalledTimes(3);
		for (const [check] of h.bufferStub.addToBuffer.mock.calls) {
			expect(check).not.toHaveProperty("egressStatus");
		}
		expect((await h.monitorsRepo.findById("mon-1", "team-1")).status).toBe("down");
		expect(h.incidentsRepo.getAll()).toHaveLength(1);
		expect(h.notificationsService.handleNotifications).toHaveBeenCalled();
	});

	it("detects down at the normal threshold when egress is confirmed ok", async () => {
		const monitor = makeMonitor();
		h.monitorsRepo.seed(monitor);

		h.setEgressStatus("ok");
		h.setNextResponse(false, NETWORK_ERROR);
		for (let i = 0; i < 3; i++) {
			await h.heartbeatJob(monitor);
		}

		for (const [check] of h.bufferStub.addToBuffer.mock.calls) {
			expect(check).toMatchObject({ status: false, egressStatus: "ok" });
		}
		expect((await h.monitorsRepo.findById("mon-1", "team-1")).status).toBe("down");
		expect(h.incidentsRepo.getAll()).toHaveLength(1);
		expect(h.notificationsService.handleNotifications).toHaveBeenCalled();
	});

	it("evaluates HTTP error responses normally while egress is degraded", async () => {
		const monitor = makeMonitor();
		h.monitorsRepo.seed(monitor);

		// The target answered, so the failure is its own even though the instance is degraded
		h.setEgressStatus("degraded");
		h.setNextResponse(false, 503);
		for (let i = 0; i < 3; i++) {
			await h.heartbeatJob(monitor);
		}

		expect(h.egressService.assessAfterFailure).not.toHaveBeenCalled();
		for (const [check] of h.bufferStub.addToBuffer.mock.calls) {
			expect(check).not.toHaveProperty("egressStatus");
		}
		expect((await h.monitorsRepo.findById("mon-1", "team-1")).status).toBe("down");
		expect(h.incidentsRepo.getAll()).toHaveLength(1);
		expect(h.incidentsRepo.getAll()[0].statusCode).toBe(503);
		expect(h.notificationsService.handleNotifications).toHaveBeenCalled();
	});

	it("evaluates a failing docker check normally while egress is degraded", async () => {
		const monitor = makeMonitor({ type: "docker", url: "unix:///var/run/docker.sock" });
		h.monitorsRepo.seed(monitor);

		h.setEgressStatus("degraded");
		h.setNextResponse(false, NETWORK_ERROR);
		for (let i = 0; i < 3; i++) {
			await h.heartbeatJob(monitor);
		}

		expect(h.egressService.assessAfterFailure).not.toHaveBeenCalled();
		for (const [check] of h.bufferStub.addToBuffer.mock.calls) {
			expect(check).not.toHaveProperty("egressStatus");
		}
		expect((await h.monitorsRepo.findById("mon-1", "team-1")).status).toBe("down");
		expect(h.incidentsRepo.getAll()).toHaveLength(1);
	});

	it("leaves an open incident open when egress drops during it", async () => {
		const monitor = makeMonitor();
		h.monitorsRepo.seed(monitor);

		// The target goes down first and is detected normally
		h.setEgressStatus(null);
		h.setNextResponse(false, NETWORK_ERROR);
		for (let i = 0; i < 3; i++) {
			await h.heartbeatJob(monitor);
		}
		expect((await h.monitorsRepo.findById("mon-1", "team-1")).status).toBe("down");
		expect(h.incidentsRepo.getAll()).toHaveLength(1);

		// Egress then drops. The monitor must stay down rather than be resolved by the silence.
		h.setEgressStatus("degraded");
		for (let i = 0; i < 3; i++) {
			await h.heartbeatJob(monitor);
		}

		expect((await h.monitorsRepo.findById("mon-1", "team-1")).status).toBe("down");
		expect(h.incidentsRepo.getAll()).toHaveLength(1);
		expect(h.notificationsService.handleNotifications).toHaveBeenCalledTimes(1);
	});

	it("starts a fresh status window after a degraded spell", async () => {
		const monitor = makeMonitor();
		h.monitorsRepo.seed(monitor);

		// 2 real failures: window [t, t, t, f, f] = 40% < 60%
		h.setNextResponse(false, NETWORK_ERROR);
		await h.heartbeatJob(monitor);
		await h.heartbeatJob(monitor);

		h.setEgressStatus("degraded");
		await h.heartbeatJob(monitor);
		await h.heartbeatJob(monitor);
		expect((await h.monitorsRepo.findById("mon-1", "team-1")).statusWindow).toEqual([]);

		// A third real failure would have taken the old window to 60%. Against a window that starts again
		// at the end of the spell it is one result, and the results either side are never adjacent.
		h.setEgressStatus(null);
		await h.heartbeatJob(monitor);
		expect((await h.monitorsRepo.findById("mon-1", "team-1")).status).toBe("up");
		expect(h.incidentsRepo.getAll()).toHaveLength(0);

		// The monitor still goes down, once the rebuilt window holds enough real failures to cross.
		for (let i = 0; i < 4; i++) {
			await h.heartbeatJob(monitor);
		}

		expect((await h.monitorsRepo.findById("mon-1", "team-1")).status).toBe("down");
		expect(h.incidentsRepo.getAll()).toHaveLength(1);
	});
});
