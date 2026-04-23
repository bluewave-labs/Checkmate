import { describe, expect, it, beforeEach } from "@jest/globals";
import { createHeartbeatTestHarness, makeMonitor, type HeartbeatTestHarness } from "../helpers/heartbeatTestHarness.ts";

describe("Heartbeat job: recovery", () => {
	let h: HeartbeatTestHarness;

	beforeEach(() => {
		h = createHeartbeatTestHarness();
	});

	it("recovers monitor and auto-resolves incident when checks pass", async () => {
		const monitor = makeMonitor();
		h.monitorsRepo.seed(monitor);

		// 3 failures to trigger down (60% threshold)
		h.setNextResponse(false, 503);
		for (let i = 0; i < 3; i++) {
			await h.heartbeatJob(monitor);
		}
		expect(h.incidentsRepo.getAll()).toHaveLength(1);
		expect(h.incidentsRepo.getAll()[0].status).toBe(true);

		// Send passing checks to push failure rate below threshold
		// Window after 3 fails: [false, false, false, false, false] (prior trues shifted out)
		// Need enough passes to drop below 60%
		h.setNextResponse(true, 200);
		for (let i = 0; i < 5; i++) {
			await h.heartbeatJob(monitor);
		}

		// Monitor should be back up
		const storedMonitor = await h.monitorsRepo.findById("mon-1", "team-1");
		expect(storedMonitor.status).toBe("up");

		// Incident should be auto-resolved
		const incidents = h.incidentsRepo.getAll();
		expect(incidents).toHaveLength(1);
		expect(incidents[0].status).toBe(false);
		expect(incidents[0].resolutionType).toBe("automatic");
		expect(incidents[0].endTime).not.toBeNull();
	});

	it("creates a new incident after recovery if monitor goes down again", async () => {
		const monitor = makeMonitor();
		h.monitorsRepo.seed(monitor);

		// First outage: 3 failures to trigger (window shifts from all-true)
		h.setNextResponse(false, 503);
		for (let i = 0; i < 3; i++) {
			await h.heartbeatJob(monitor);
		}

		// Recovery: enough passes to drop below threshold
		h.setNextResponse(true, 200);
		for (let i = 0; i < 5; i++) {
			await h.heartbeatJob(monitor);
		}

		// Second outage: 3 more failures to trigger again
		h.setNextResponse(false, 502);
		for (let i = 0; i < 3; i++) {
			await h.heartbeatJob(monitor);
		}

		const incidents = h.incidentsRepo.getAll();
		expect(incidents).toHaveLength(2);

		// First incident resolved
		expect(incidents[0].status).toBe(false);
		expect(incidents[0].resolutionType).toBe("automatic");
		expect(incidents[0].statusCode).toBe(503);

		// Second incident active
		expect(incidents[1].status).toBe(true);
		expect(incidents[1].statusCode).toBe(502);
	});
});
