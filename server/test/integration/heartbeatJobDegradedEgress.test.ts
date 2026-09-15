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
		expect(storedMonitor.statusWindow).toEqual([true, true, true, true, true]);
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

	it("keeps counting real failures taken either side of a degraded spell", async () => {
		const monitor = makeMonitor();
		h.monitorsRepo.seed(monitor);

		// 2 real failures: window [t, t, t, f, f] = 40% < 60%
		h.setNextResponse(false, NETWORK_ERROR);
		await h.heartbeatJob(monitor);
		await h.heartbeatJob(monitor);

		// A degraded spell must not push the window over the threshold
		h.setEgressStatus("degraded");
		await h.heartbeatJob(monitor);
		await h.heartbeatJob(monitor);
		expect((await h.monitorsRepo.findById("mon-1", "team-1")).status).toBe("up");
		expect(h.incidentsRepo.getAll()).toHaveLength(0);

		// 3rd real failure: window [t, t, f, f, f] = 60% >= 60%
		h.setEgressStatus(null);
		await h.heartbeatJob(monitor);

		expect((await h.monitorsRepo.findById("mon-1", "team-1")).status).toBe("down");
		expect(h.incidentsRepo.getAll()).toHaveLength(1);
	});
});
