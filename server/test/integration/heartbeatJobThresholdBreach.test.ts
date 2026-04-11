import { describe, expect, it, beforeEach } from "@jest/globals";
import { createHeartbeatTestHarness, makeMonitor, type HeartbeatTestHarness } from "../helpers/heartbeatTestHarness.ts";
import type { MonitorStatusResponse } from "../../src/types/network.ts";
import type { HardwareStatusPayload } from "../../src/types/network.ts";

const makeHardwareResponse = (cpuUsage: number): MonitorStatusResponse<HardwareStatusPayload> => ({
	monitorId: "mon-1",
	teamId: "team-1",
	type: "hardware",
	status: true,
	code: 200,
	message: "OK",
	responseTime: 50,
	payload: {
		data: {
			cpu: { usage_percent: cpuUsage, temperature: [] },
			memory: { usage_percent: 0.3 },
			disk: [{ usage_percent: 0.2 }],
		},
	},
});

describe("Heartbeat job: hardware threshold breach", () => {
	let h: HeartbeatTestHarness;

	beforeEach(() => {
		h = createHeartbeatTestHarness();
	});

	it("transitions to breached and creates incident after alert counter hits zero", async () => {
		// Hardware monitor with CPU threshold at 80% (stored as 80, compared as 80/100 = 0.8)
		// Alert counters start at 5, decrement each breach, trigger at 0
		const monitor = makeMonitor({
			type: "hardware",
			status: "up",
			cpuAlertThreshold: 80,
			cpuAlertCounter: 5,
			memoryAlertThreshold: 100,
			memoryAlertCounter: 5,
			diskAlertThreshold: 100,
			diskAlertCounter: 5,
			tempAlertThreshold: 100,
			tempAlertCounter: 5,
			selectedDisks: [],
		});
		h.monitorsRepo.seed(monitor);

		// CPU at 90% (0.9) exceeds threshold of 80% (0.8)
		h.setNextResponseFull(makeHardwareResponse(0.9));

		// Configure message builder for when incident is created
		h.messageBuilder.extractThresholdBreaches.mockReturnValue([{ metric: "cpu", formattedValue: "90%", threshold: 80, unit: "%" }]);

		// 4 heartbeats: counter goes 5→4→3→2→1, status still "up"
		for (let i = 0; i < 4; i++) {
			await h.heartbeatJob(monitor);
		}

		let storedMonitor = await h.monitorsRepo.findById("mon-1", "team-1");
		expect(storedMonitor.status).toBe("up");
		expect(storedMonitor.cpuAlertCounter).toBe(1);
		expect(h.incidentsRepo.getAll()).toHaveLength(0);

		// 5th heartbeat: counter hits 0, status transitions to "breached"
		await h.heartbeatJob(monitor);

		storedMonitor = await h.monitorsRepo.findById("mon-1", "team-1");
		expect(storedMonitor.status).toBe("breached");
		expect(storedMonitor.cpuAlertCounter).toBe(0);

		// Incident created with statusCode 9999 and threshold message
		const incidents = h.incidentsRepo.getAll();
		expect(incidents).toHaveLength(1);
		expect(incidents[0].statusCode).toBe(9999);
		expect(incidents[0].message).toBe("CPU: 90% (threshold: 80%)");
		expect(incidents[0].status).toBe(true);

		// Notification should have been triggered
		expect(h.notificationsService.handleNotifications).toHaveBeenCalled();
	});

	it("recovers from breached to up when metrics return to normal", async () => {
		// Start with a monitor already in breached state with counter at 0
		const monitor = makeMonitor({
			type: "hardware",
			status: "breached",
			cpuAlertThreshold: 80,
			cpuAlertCounter: 0,
			memoryAlertThreshold: 100,
			memoryAlertCounter: 5,
			diskAlertThreshold: 100,
			diskAlertCounter: 5,
			tempAlertThreshold: 100,
			tempAlertCounter: 5,
			selectedDisks: [],
		});
		h.monitorsRepo.seed(monitor);

		// Also seed an active incident for this monitor
		await h.incidentsRepo.create({
			monitorId: "mon-1",
			teamId: "team-1",
			status: true,
			statusCode: 9999,
			message: "CPU: 90% (threshold: 80%)",
		});

		// CPU at 50% (0.5) — below threshold of 80% (0.8)
		h.setNextResponseFull(makeHardwareResponse(0.5));

		await h.heartbeatJob(monitor);

		// Monitor should recover to "up"
		const storedMonitor = await h.monitorsRepo.findById("mon-1", "team-1");
		expect(storedMonitor.status).toBe("up");
		// Counter resets to 5 when not breaching
		expect(storedMonitor.cpuAlertCounter).toBe(5);

		// Incident should be auto-resolved
		const incidents = h.incidentsRepo.getAll();
		expect(incidents).toHaveLength(1);
		expect(incidents[0].status).toBe(false);
		expect(incidents[0].resolutionType).toBe("automatic");
	});

	it("does not create duplicate incidents while remaining breached", async () => {
		const monitor = makeMonitor({
			type: "hardware",
			status: "up",
			cpuAlertThreshold: 80,
			cpuAlertCounter: 5,
			memoryAlertThreshold: 100,
			memoryAlertCounter: 5,
			diskAlertThreshold: 100,
			diskAlertCounter: 5,
			tempAlertThreshold: 100,
			tempAlertCounter: 5,
			selectedDisks: [],
		});
		h.monitorsRepo.seed(monitor);

		h.setNextResponseFull(makeHardwareResponse(0.9));
		h.messageBuilder.extractThresholdBreaches.mockReturnValue([{ metric: "cpu", formattedValue: "90%", threshold: 80, unit: "%" }]);

		// 5 heartbeats to trigger breach, then 5 more while still breaching
		for (let i = 0; i < 10; i++) {
			await h.heartbeatJob(monitor);
		}

		// Only one incident despite 10 heartbeats
		expect(h.incidentsRepo.getAll()).toHaveLength(1);
	});
});
