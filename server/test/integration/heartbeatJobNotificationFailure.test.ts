import { describe, expect, it, beforeEach } from "@jest/globals";
import { createHeartbeatTestHarness, makeMonitor, type HeartbeatTestHarness } from "../helpers/heartbeatTestHarness.ts";

describe("Heartbeat job: notification failure isolation", () => {
	let h: HeartbeatTestHarness;

	beforeEach(() => {
		h = createHeartbeatTestHarness();
	});

	it("creates incident even when notification dispatch throws", async () => {
		const monitor = makeMonitor();
		h.monitorsRepo.seed(monitor);

		// Make notifications throw
		h.notificationsService.handleNotifications.mockRejectedValue(new Error("SMTP connection refused"));

		// Drive monitor down
		h.setNextResponse(false, 503);
		for (let i = 0; i < 3; i++) {
			await h.heartbeatJob(monitor);
		}

		// Incident should still have been created
		const incidents = h.incidentsRepo.getAll();
		expect(incidents).toHaveLength(1);
		expect(incidents[0].status).toBe(true);
		expect(incidents[0].statusCode).toBe(503);

		// Monitor should still be marked down
		const storedMonitor = await h.monitorsRepo.findById("mon-1", "team-1");
		expect(storedMonitor.status).toBe("down");
	});

	it("auto-resolves incident even when recovery notification throws", async () => {
		const monitor = makeMonitor();
		h.monitorsRepo.seed(monitor);

		// Drive monitor down (notifications succeed here)
		h.setNextResponse(false, 503);
		for (let i = 0; i < 3; i++) {
			await h.heartbeatJob(monitor);
		}
		expect(h.incidentsRepo.getAll()[0].status).toBe(true);

		// Now make notifications throw for the recovery
		h.notificationsService.handleNotifications.mockRejectedValue(new Error("Slack API timeout"));

		// Recover
		h.setNextResponse(true, 200);
		for (let i = 0; i < 5; i++) {
			await h.heartbeatJob(monitor);
		}

		// Incident should still be resolved despite notification failure
		const incidents = h.incidentsRepo.getAll();
		expect(incidents).toHaveLength(1);
		expect(incidents[0].status).toBe(false);
		expect(incidents[0].resolutionType).toBe("automatic");
	});
});
