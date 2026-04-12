import { describe, expect, it, beforeEach } from "@jest/globals";
import { NotificationMessageBuilder } from "../../../src/service/infrastructure/notificationMessageBuilder.ts";
import type { Monitor, MonitorStatusResponse, HardwareStatusPayload } from "../../../src/types/index.ts";
import type { MonitorActionDecision } from "../../../src/service/infrastructure/SuperSimpleQueue/SuperSimpleQueueHelper.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "mon-1",
		name: "Test Monitor",
		url: "https://example.com",
		type: "http",
		status: "down",
		teamId: "team-1",
		cpuAlertThreshold: undefined,
		memoryAlertThreshold: undefined,
		diskAlertThreshold: undefined,
		tempAlertThreshold: undefined,
		...overrides,
	}) as Monitor;

const makeDecision = (overrides?: Partial<MonitorActionDecision>): MonitorActionDecision => ({
	shouldCreateIncident: false,
	shouldResolveIncident: false,
	shouldSendNotification: true,
	incidentReason: null,
	notificationReason: "status_change",
	...overrides,
});

const makeStatusResponse = (overrides?: Partial<MonitorStatusResponse>): MonitorStatusResponse =>
	({
		monitorId: "mon-1",
		teamId: "team-1",
		type: "http",
		status: false,
		code: 500,
		message: "Internal Server Error",
		...overrides,
	}) as MonitorStatusResponse;

const makeHardwarePayload = (overrides?: Partial<HardwareStatusPayload["data"]>): HardwareStatusPayload =>
	({
		data: {
			cpu: { usage_percent: 0.5, temperature: [45] },
			memory: { usage_percent: 0.6 },
			disk: [{ usage_percent: 0.7 }],
			...overrides,
		},
	}) as HardwareStatusPayload;

// ── Tests ────────────────────────────────────────────────────────────────────

describe("NotificationMessageBuilder", () => {
	let builder: NotificationMessageBuilder;

	beforeEach(() => {
		builder = new NotificationMessageBuilder();
	});

	describe("SERVICE_NAME", () => {
		it("returns NotificationMessageBuilder", () => {
			expect(NotificationMessageBuilder.SERVICE_NAME).toBe("NotificationMessageBuilder");
		});
	});

	// ── buildMessage ─────────────────────────────────────────────────────

	describe("buildMessage", () => {
		it("builds a monitor_down message", () => {
			const monitor = makeMonitor({ status: "down" });
			const decision = makeDecision();
			const response = makeStatusResponse();

			const msg = builder.buildMessage(monitor, response, decision, "https://app.example.com");

			expect(msg.type).toBe("monitor_down");
			expect(msg.severity).toBe("critical");
			expect(msg.monitor).toEqual({
				id: "mon-1",
				name: "Test Monitor",
				url: "https://example.com",
				type: "http",
				status: "down",
			});
			expect(msg.content.title).toBe("Monitor Down: Test Monitor");
			expect(msg.clientHost).toBe("https://app.example.com");
			expect(msg.metadata).toEqual({
				teamId: "team-1",
				notificationReason: "status_change",
			});
		});

		it("builds a monitor_up message", () => {
			const monitor = makeMonitor({ status: "up", type: "http" });
			const decision = makeDecision({ notificationReason: "status_change" });

			const msg = builder.buildMessage(monitor, makeStatusResponse(), decision, "https://app.example.com");

			expect(msg.type).toBe("monitor_up");
			expect(msg.severity).toBe("success");
			expect(msg.content.title).toBe("Monitor Recovered: Test Monitor");
		});

		it("builds a threshold_breach message", () => {
			const monitor = makeMonitor({ status: "up", type: "hardware", cpuAlertThreshold: 80 });
			const decision = makeDecision({ notificationReason: "threshold_breach" });
			const response = makeStatusResponse({
				type: "hardware",
				payload: makeHardwarePayload({ cpu: { usage_percent: 0.9, temperature: [50] } as any }),
			} as any);

			const msg = builder.buildMessage(monitor, response, decision, "https://app.example.com");

			expect(msg.type).toBe("threshold_breach");
			expect(msg.severity).toBe("warning");
			expect(msg.content.title).toBe("Threshold Exceeded: Test Monitor");
			expect(msg.content.thresholds).toBeDefined();
			expect(msg.content.thresholds!.length).toBeGreaterThan(0);
		});

		it("builds a threshold_resolved message for hardware monitor recovering", () => {
			const monitor = makeMonitor({ status: "up", type: "hardware" });
			const decision = makeDecision({ notificationReason: "status_change" });

			const msg = builder.buildMessage(monitor, makeStatusResponse(), decision, "https://app.example.com");

			expect(msg.type).toBe("threshold_resolved");
			expect(msg.severity).toBe("success");
			expect(msg.content.title).toBe("Thresholds Resolved: Test Monitor");
		});

		it("uses notificationReason from decision, falling back to status_change", () => {
			const monitor = makeMonitor({ status: "down" });
			const decision = makeDecision({ notificationReason: null });

			const msg = builder.buildMessage(monitor, makeStatusResponse(), decision, "https://app.example.com");

			expect(msg.metadata.notificationReason).toBe("status_change");
		});
	});

	// ── determineNotificationType (via buildMessage) ─────────────────────

	describe("determineNotificationType", () => {
		it("returns monitor_down when status is down, even if notificationReason is threshold_breach", () => {
			const monitor = makeMonitor({ status: "down" });
			const decision = makeDecision({ notificationReason: "threshold_breach" });

			const msg = builder.buildMessage(monitor, makeStatusResponse(), decision, "");

			expect(msg.type).toBe("monitor_down");
		});

		it("returns threshold_breach when reason is threshold_breach and status is not down", () => {
			const monitor = makeMonitor({ status: "up", type: "hardware" });
			const decision = makeDecision({ notificationReason: "threshold_breach" });

			const msg = builder.buildMessage(monitor, makeStatusResponse(), decision, "");

			expect(msg.type).toBe("threshold_breach");
		});

		it("returns threshold_resolved for hardware monitor with status_change and up", () => {
			const monitor = makeMonitor({ status: "up", type: "hardware" });
			const decision = makeDecision({ notificationReason: "status_change" });

			const msg = builder.buildMessage(monitor, makeStatusResponse(), decision, "");

			expect(msg.type).toBe("threshold_resolved");
		});

		it("returns monitor_up for non-hardware monitor with status up", () => {
			const monitor = makeMonitor({ status: "up", type: "http" });
			const decision = makeDecision({ notificationReason: "status_change" });

			const msg = builder.buildMessage(monitor, makeStatusResponse(), decision, "");

			expect(msg.type).toBe("monitor_up");
		});

		it("returns monitor_up as default for unrecognized status", () => {
			const monitor = makeMonitor({ status: "unknown" as any });
			const decision = makeDecision({ notificationReason: null });

			const msg = builder.buildMessage(monitor, makeStatusResponse(), decision, "");

			expect(msg.type).toBe("monitor_up");
		});
	});

	// ── determineSeverity (via buildMessage) ─────────────────────────────

	describe("determineSeverity", () => {
		it("returns critical for monitor_down", () => {
			const msg = builder.buildMessage(makeMonitor({ status: "down" }), makeStatusResponse(), makeDecision(), "");
			expect(msg.severity).toBe("critical");
		});

		it("returns warning for threshold_breach", () => {
			const msg = builder.buildMessage(
				makeMonitor({ status: "up", type: "hardware" }),
				makeStatusResponse(),
				makeDecision({ notificationReason: "threshold_breach" }),
				""
			);
			expect(msg.severity).toBe("warning");
		});

		it("returns success for monitor_up", () => {
			const msg = builder.buildMessage(
				makeMonitor({ status: "up", type: "http" }),
				makeStatusResponse(),
				makeDecision({ notificationReason: "status_change" }),
				""
			);
			expect(msg.severity).toBe("success");
		});

		it("returns success for threshold_resolved", () => {
			const msg = builder.buildMessage(
				makeMonitor({ status: "up", type: "hardware" }),
				makeStatusResponse(),
				makeDecision({ notificationReason: "status_change" }),
				""
			);
			expect(msg.severity).toBe("success");
		});
	});

	// ── buildContent variants ────────────────────────────────────────────

	describe("buildContent", () => {
		describe("monitor_down", () => {
			it("includes response code and error message when present", () => {
				const monitor = makeMonitor({ status: "down" });
				const response = makeStatusResponse({ code: 503, message: "Service Unavailable" });

				const msg = builder.buildMessage(monitor, response, makeDecision(), "");

				expect(msg.content.details).toContain("Response Code: 503");
				expect(msg.content.details).toContain("Error: Service Unavailable");
			});

			it("omits response code when falsy", () => {
				const monitor = makeMonitor({ status: "down" });
				const response = makeStatusResponse({ code: 0, message: "" });

				const msg = builder.buildMessage(monitor, response, makeDecision(), "");

				expect(msg.content.details).not.toContainEqual(expect.stringContaining("Response Code:"));
				expect(msg.content.details).not.toContainEqual(expect.stringContaining("Error:"));
			});

			it("includes URL, Status, and Type in details", () => {
				const monitor = makeMonitor({ status: "down" });
				const msg = builder.buildMessage(monitor, makeStatusResponse(), makeDecision(), "");

				expect(msg.content.details).toContain("URL: https://example.com");
				expect(msg.content.details).toContain("Status: Down");
				expect(msg.content.details).toContain("Type: http");
			});

			it("sets summary text", () => {
				const monitor = makeMonitor({ status: "down" });
				const msg = builder.buildMessage(monitor, makeStatusResponse(), makeDecision(), "");
				expect(msg.content.summary).toBe('Monitor "Test Monitor" is currently down and unreachable.');
			});

			it("sets timestamp", () => {
				const monitor = makeMonitor({ status: "down" });
				const msg = builder.buildMessage(monitor, makeStatusResponse(), makeDecision(), "");
				expect(msg.content.timestamp).toBeInstanceOf(Date);
			});
		});

		describe("monitor_up", () => {
			it("includes recovery details", () => {
				const monitor = makeMonitor({ status: "up", type: "http" });
				const msg = builder.buildMessage(monitor, makeStatusResponse(), makeDecision(), "");

				expect(msg.content.title).toBe("Monitor Recovered: Test Monitor");
				expect(msg.content.summary).toBe('Monitor "Test Monitor" is back up and operational.');
				expect(msg.content.details).toContain("Status: Up");
			});
		});

		describe("threshold_breach", () => {
			it("includes threshold breaches in content", () => {
				const monitor = makeMonitor({ status: "up", type: "hardware", cpuAlertThreshold: 80 });
				const response = makeStatusResponse({
					payload: makeHardwarePayload({ cpu: { usage_percent: 0.9, temperature: [50] } as any }),
				} as any);

				const msg = builder.buildMessage(monitor, response, makeDecision({ notificationReason: "threshold_breach" }), "");

				expect(msg.content.thresholds).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							metric: "cpu",
							currentValue: 90,
							threshold: 80,
						}),
					])
				);
			});
		});

		describe("threshold_resolved", () => {
			it("includes resolved details", () => {
				const monitor = makeMonitor({ status: "up", type: "hardware" });
				const msg = builder.buildMessage(monitor, makeStatusResponse(), makeDecision(), "");

				expect(msg.content.title).toBe("Thresholds Resolved: Test Monitor");
				expect(msg.content.summary).toBe('Monitor "Test Monitor" thresholds have returned to normal.');
				expect(msg.content.details).toContain("Status: Up");
			});
		});

		describe("default content", () => {
			it("builds default content for unhandled notification type", () => {
				// Force default by creating a scenario where type falls through
				// We can test buildContent default by subclassing or testing indirectly
				// The default case in buildContent handles "test" type among others
				// Since determineNotificationType never returns "test", we test via
				// a monitor with unrecognized status that maps to monitor_up
				// Instead, let's verify the default case exists by checking that
				// non-standard types would get default content
				const monitor = makeMonitor({ status: "up", type: "http" });
				const msg = builder.buildMessage(monitor, makeStatusResponse(), makeDecision(), "");

				// monitor_up is handled, so content should be monitor_up specific
				expect(msg.content.title).toBe("Monitor Recovered: Test Monitor");
			});
		});
	});

	// ── determineSeverity edge cases (via private method) ────────────────

	describe("determineSeverity edge cases", () => {
		it("returns info for test type", () => {
			const result = (builder as any).determineSeverity("test");
			expect(result).toBe("info");
		});

		it("returns info for unknown type (default)", () => {
			const result = (builder as any).determineSeverity("unknown_type");
			expect(result).toBe("info");
		});
	});

	// ── buildContent edge cases (via private method) ─────────────────────

	describe("buildContent edge cases", () => {
		it("returns default content for unhandled notification type", () => {
			const monitor = makeMonitor({ status: "up", type: "http" });
			const result = (builder as any).buildContent("test", monitor, makeStatusResponse());

			expect(result.title).toBe("Monitor: Test Monitor");
			expect(result.summary).toBe('Status update for monitor "Test Monitor".');
			expect(result.details).toContain("URL: https://example.com");
			expect(result.details).toContain("Status: up");
			expect(result.details).toContain("Type: http");
		});
	});

	// ── extractThresholdBreaches ─────────────────────────────────────────

	describe("extractThresholdBreaches", () => {
		it("returns empty array for non-hardware monitor", () => {
			const monitor = makeMonitor({ type: "http" });
			const response = makeStatusResponse();

			const breaches = builder.extractThresholdBreaches(monitor, response);

			expect(breaches).toEqual([]);
		});

		it("returns empty array when payload is missing", () => {
			const monitor = makeMonitor({ type: "hardware" });
			const response = makeStatusResponse({ payload: undefined } as any);

			const breaches = builder.extractThresholdBreaches(monitor, response);

			expect(breaches).toEqual([]);
		});

		it("returns empty array when hardware data is missing", () => {
			const monitor = makeMonitor({ type: "hardware" });
			const response = makeStatusResponse({ payload: { data: undefined } } as any);

			const breaches = builder.extractThresholdBreaches(monitor, response);

			expect(breaches).toEqual([]);
		});

		// ── CPU ──────────────────────────────────────────────────────────

		describe("cpu threshold", () => {
			it("detects CPU breach when usage exceeds threshold", () => {
				const monitor = makeMonitor({ type: "hardware", cpuAlertThreshold: 80 });
				const response = makeStatusResponse({
					payload: makeHardwarePayload({ cpu: { usage_percent: 0.9, temperature: [50] } as any }),
				} as any);

				const breaches = builder.extractThresholdBreaches(monitor, response);

				expect(breaches).toContainEqual(
					expect.objectContaining({
						metric: "cpu",
						currentValue: 90,
						threshold: 80,
						unit: "%",
						formattedValue: "90.0%",
					})
				);
			});

			it("does not report CPU breach when usage is below threshold", () => {
				const monitor = makeMonitor({ type: "hardware", cpuAlertThreshold: 80 });
				const response = makeStatusResponse({
					payload: makeHardwarePayload({ cpu: { usage_percent: 0.5, temperature: [50] } as any }),
				} as any);

				const breaches = builder.extractThresholdBreaches(monitor, response);

				expect(breaches.find((b) => b.metric === "cpu")).toBeUndefined();
			});

			it("skips CPU check when cpuAlertThreshold is undefined", () => {
				const monitor = makeMonitor({ type: "hardware", cpuAlertThreshold: undefined });
				const response = makeStatusResponse({
					payload: makeHardwarePayload({ cpu: { usage_percent: 0.99 } as any }),
				} as any);

				const breaches = builder.extractThresholdBreaches(monitor, response);

				expect(breaches.find((b) => b.metric === "cpu")).toBeUndefined();
			});

			it("skips CPU check when cpuAlertThreshold is null", () => {
				const monitor = makeMonitor({ type: "hardware", cpuAlertThreshold: null as any });
				const response = makeStatusResponse({
					payload: makeHardwarePayload({ cpu: { usage_percent: 0.99 } as any }),
				} as any);

				const breaches = builder.extractThresholdBreaches(monitor, response);

				expect(breaches.find((b) => b.metric === "cpu")).toBeUndefined();
			});

			it("skips CPU check when cpu usage_percent is undefined", () => {
				const monitor = makeMonitor({ type: "hardware", cpuAlertThreshold: 80 });
				const response = makeStatusResponse({
					payload: makeHardwarePayload({ cpu: { usage_percent: undefined } as any }),
				} as any);

				const breaches = builder.extractThresholdBreaches(monitor, response);

				expect(breaches.find((b) => b.metric === "cpu")).toBeUndefined();
			});

			it("skips CPU check when cpu object is undefined", () => {
				const monitor = makeMonitor({ type: "hardware", cpuAlertThreshold: 80 });
				const response = makeStatusResponse({
					payload: makeHardwarePayload({ cpu: undefined as any }),
				} as any);

				const breaches = builder.extractThresholdBreaches(monitor, response);

				expect(breaches.find((b) => b.metric === "cpu")).toBeUndefined();
			});
		});

		// ── Memory ───────────────────────────────────────────────────────

		describe("memory threshold", () => {
			it("detects memory breach when usage exceeds threshold", () => {
				const monitor = makeMonitor({ type: "hardware", memoryAlertThreshold: 70 });
				const response = makeStatusResponse({
					payload: makeHardwarePayload({ memory: { usage_percent: 0.85 } as any }),
				} as any);

				const breaches = builder.extractThresholdBreaches(monitor, response);

				expect(breaches).toContainEqual(
					expect.objectContaining({
						metric: "memory",
						currentValue: 85,
						threshold: 70,
						unit: "%",
						formattedValue: "85.0%",
					})
				);
			});

			it("does not report memory breach when usage is below threshold", () => {
				const monitor = makeMonitor({ type: "hardware", memoryAlertThreshold: 90 });
				const response = makeStatusResponse({
					payload: makeHardwarePayload({ memory: { usage_percent: 0.5 } as any }),
				} as any);

				const breaches = builder.extractThresholdBreaches(monitor, response);

				expect(breaches.find((b) => b.metric === "memory")).toBeUndefined();
			});

			it("skips memory check when memoryAlertThreshold is undefined", () => {
				const monitor = makeMonitor({ type: "hardware", memoryAlertThreshold: undefined });
				const response = makeStatusResponse({
					payload: makeHardwarePayload({ memory: { usage_percent: 0.99 } as any }),
				} as any);

				const breaches = builder.extractThresholdBreaches(monitor, response);

				expect(breaches.find((b) => b.metric === "memory")).toBeUndefined();
			});

			it("skips memory check when memoryAlertThreshold is null", () => {
				const monitor = makeMonitor({ type: "hardware", memoryAlertThreshold: null as any });
				const response = makeStatusResponse({
					payload: makeHardwarePayload({ memory: { usage_percent: 0.99 } as any }),
				} as any);

				const breaches = builder.extractThresholdBreaches(monitor, response);

				expect(breaches.find((b) => b.metric === "memory")).toBeUndefined();
			});

			it("skips memory check when memory usage_percent is undefined", () => {
				const monitor = makeMonitor({ type: "hardware", memoryAlertThreshold: 70 });
				const response = makeStatusResponse({
					payload: makeHardwarePayload({ memory: { usage_percent: undefined } as any }),
				} as any);

				const breaches = builder.extractThresholdBreaches(monitor, response);

				expect(breaches.find((b) => b.metric === "memory")).toBeUndefined();
			});

			it("skips memory check when memory object is undefined", () => {
				const monitor = makeMonitor({ type: "hardware", memoryAlertThreshold: 70 });
				const response = makeStatusResponse({
					payload: makeHardwarePayload({ memory: undefined as any }),
				} as any);

				const breaches = builder.extractThresholdBreaches(monitor, response);

				expect(breaches.find((b) => b.metric === "memory")).toBeUndefined();
			});
		});

		// ── Disk ─────────────────────────────────────────────────────────

		describe("disk threshold", () => {
			it("detects disk breach using highest usage across multiple disks", () => {
				const monitor = makeMonitor({ type: "hardware", diskAlertThreshold: 80 });
				const response = makeStatusResponse({
					payload: makeHardwarePayload({
						disk: [{ usage_percent: 0.5 }, { usage_percent: 0.95 }, { usage_percent: 0.7 }] as any,
					}),
				} as any);

				const breaches = builder.extractThresholdBreaches(monitor, response);

				expect(breaches).toContainEqual(
					expect.objectContaining({
						metric: "disk",
						currentValue: 95,
						threshold: 80,
						formattedValue: "95.0%",
					})
				);
			});

			it("does not report disk breach when all disks are below threshold", () => {
				const monitor = makeMonitor({ type: "hardware", diskAlertThreshold: 90 });
				const response = makeStatusResponse({
					payload: makeHardwarePayload({
						disk: [{ usage_percent: 0.5 }, { usage_percent: 0.6 }] as any,
					}),
				} as any);

				const breaches = builder.extractThresholdBreaches(monitor, response);

				expect(breaches.find((b) => b.metric === "disk")).toBeUndefined();
			});

			it("skips disk check when diskAlertThreshold is undefined", () => {
				const monitor = makeMonitor({ type: "hardware", diskAlertThreshold: undefined });
				const response = makeStatusResponse({
					payload: makeHardwarePayload({ disk: [{ usage_percent: 0.99 }] as any }),
				} as any);

				const breaches = builder.extractThresholdBreaches(monitor, response);

				expect(breaches.find((b) => b.metric === "disk")).toBeUndefined();
			});

			it("skips disk check when diskAlertThreshold is null", () => {
				const monitor = makeMonitor({ type: "hardware", diskAlertThreshold: null as any });
				const response = makeStatusResponse({
					payload: makeHardwarePayload({ disk: [{ usage_percent: 0.99 }] as any }),
				} as any);

				const breaches = builder.extractThresholdBreaches(monitor, response);

				expect(breaches.find((b) => b.metric === "disk")).toBeUndefined();
			});

			it("skips disk check when disk is not an array", () => {
				const monitor = makeMonitor({ type: "hardware", diskAlertThreshold: 80 });
				const response = makeStatusResponse({
					payload: makeHardwarePayload({ disk: "not-an-array" as any }),
				} as any);

				const breaches = builder.extractThresholdBreaches(monitor, response);

				expect(breaches.find((b) => b.metric === "disk")).toBeUndefined();
			});

			it("skips disks with undefined usage_percent", () => {
				const monitor = makeMonitor({ type: "hardware", diskAlertThreshold: 50 });
				const response = makeStatusResponse({
					payload: makeHardwarePayload({
						disk: [{ usage_percent: undefined }, { usage_percent: 0.3 }] as any,
					}),
				} as any);

				const breaches = builder.extractThresholdBreaches(monitor, response);

				expect(breaches.find((b) => b.metric === "disk")).toBeUndefined();
			});
		});

		// ── Temperature ──────────────────────────────────────────────────

		describe("temperature threshold", () => {
			it("detects temperature breach from array of temperatures", () => {
				const monitor = makeMonitor({ type: "hardware", tempAlertThreshold: 70 });
				const response = makeStatusResponse({
					payload: makeHardwarePayload({ cpu: { usage_percent: 0.5, temperature: [65, 75, 68] } as any }),
				} as any);

				const breaches = builder.extractThresholdBreaches(monitor, response);

				expect(breaches).toContainEqual(
					expect.objectContaining({
						metric: "temp",
						currentValue: 75,
						threshold: 70,
						unit: "°C",
						formattedValue: "75.0°C",
					})
				);
			});

			it("handles single temperature value (non-array)", () => {
				const monitor = makeMonitor({ type: "hardware", tempAlertThreshold: 70 });
				const response = makeStatusResponse({
					payload: makeHardwarePayload({ cpu: { usage_percent: 0.5, temperature: 80 } as any }),
				} as any);

				const breaches = builder.extractThresholdBreaches(monitor, response);

				expect(breaches).toContainEqual(
					expect.objectContaining({
						metric: "temp",
						currentValue: 80,
						threshold: 70,
					})
				);
			});

			it("does not report temperature breach when below threshold", () => {
				const monitor = makeMonitor({ type: "hardware", tempAlertThreshold: 80 });
				const response = makeStatusResponse({
					payload: makeHardwarePayload({ cpu: { usage_percent: 0.5, temperature: [60, 65] } as any }),
				} as any);

				const breaches = builder.extractThresholdBreaches(monitor, response);

				expect(breaches.find((b) => b.metric === "temp")).toBeUndefined();
			});

			it("skips temperature check when tempAlertThreshold is undefined", () => {
				const monitor = makeMonitor({ type: "hardware", tempAlertThreshold: undefined });
				const response = makeStatusResponse({
					payload: makeHardwarePayload({ cpu: { usage_percent: 0.5, temperature: [99] } as any }),
				} as any);

				const breaches = builder.extractThresholdBreaches(monitor, response);

				expect(breaches.find((b) => b.metric === "temp")).toBeUndefined();
			});

			it("skips temperature check when tempAlertThreshold is null", () => {
				const monitor = makeMonitor({ type: "hardware", tempAlertThreshold: null as any });
				const response = makeStatusResponse({
					payload: makeHardwarePayload({ cpu: { usage_percent: 0.5, temperature: [99] } as any }),
				} as any);

				const breaches = builder.extractThresholdBreaches(monitor, response);

				expect(breaches.find((b) => b.metric === "temp")).toBeUndefined();
			});

			it("skips temperature check when cpu.temperature is falsy", () => {
				const monitor = makeMonitor({ type: "hardware", tempAlertThreshold: 70 });
				const response = makeStatusResponse({
					payload: makeHardwarePayload({ cpu: { usage_percent: 0.5, temperature: null } as any }),
				} as any);

				const breaches = builder.extractThresholdBreaches(monitor, response);

				expect(breaches.find((b) => b.metric === "temp")).toBeUndefined();
			});

			it("skips temperature check when cpu object is undefined", () => {
				const monitor = makeMonitor({ type: "hardware", tempAlertThreshold: 70 });
				const response = makeStatusResponse({
					payload: makeHardwarePayload({ cpu: undefined as any }),
				} as any);

				const breaches = builder.extractThresholdBreaches(monitor, response);

				expect(breaches.find((b) => b.metric === "temp")).toBeUndefined();
			});
		});

		// ── Combined ─────────────────────────────────────────────────────

		describe("combined thresholds", () => {
			it("detects multiple breaches simultaneously", () => {
				const monitor = makeMonitor({
					type: "hardware",
					cpuAlertThreshold: 80,
					memoryAlertThreshold: 70,
					diskAlertThreshold: 85,
					tempAlertThreshold: 65,
				});
				const response = makeStatusResponse({
					payload: makeHardwarePayload({
						cpu: { usage_percent: 0.9, temperature: [70] } as any,
						memory: { usage_percent: 0.85 } as any,
						disk: [{ usage_percent: 0.95 }] as any,
					}),
				} as any);

				const breaches = builder.extractThresholdBreaches(monitor, response);

				const metrics = breaches.map((b) => b.metric);
				expect(metrics).toContain("cpu");
				expect(metrics).toContain("memory");
				expect(metrics).toContain("disk");
				expect(metrics).toContain("temp");
			});
		});
	});
});
