import { describe, expect, it, beforeEach } from "@jest/globals";
import { NotificationMessageBuilder } from "../../../src/domain/notifications/notification.message-builder.ts";
import type { HardwareBreaches, Monitor } from "../../../src/domain/monitors/monitor.type.ts";
import type { Check } from "../../../src/domain/checks/check.type.ts";
import type { DockerContainerInfo } from "../../../src/domain/docker/docker.type.ts";
import type { MonitorActionDecision } from "../../../src/worker/worker.interface.ts";

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
	transition: "status_down",
	...overrides,
});

const makeCheck = (overrides?: Partial<Check>): Check => ({
	id: "check-1",
	metadata: { monitorId: "mon-1", teamId: "team-1", type: "http" },
	status: false,
	responseTime: 100,
	statusCode: 500,
	message: "Internal Server Error",
	createdAt: "2026-01-01T00:00:00Z",
	updatedAt: "2026-01-01T00:00:00Z",
	...overrides,
});

const makeContainers = (containers: Partial<DockerContainerInfo>[]): DockerContainerInfo[] =>
	containers.map((container, index) => ({
		id: `container-${index}`,
		name: `container-${index}`,
		image: "nginx:latest",
		state: "running",
		status: "Up 3 hours",
		health: "none",
		...container,
	}));

const makeDockerMonitor = (overrides?: Partial<Monitor>): Monitor =>
	makeMonitor({
		type: "docker",
		status: "breached",
		url: "unix:///var/run/docker.sock",
		dockerAlertOnStopped: true,
		dockerAlertOnUnhealthy: true,
		...overrides,
	});

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
			const check = makeCheck();

			const msg = builder.buildMessage(monitor, check, decision, "https://app.example.com");

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
			expect(msg.metadata).toEqual({ teamId: "team-1" });
		});

		it("builds a monitor_up message", () => {
			const monitor = makeMonitor({ status: "up", type: "http" });
			const decision = makeDecision({ transition: "status_up" });

			const msg = builder.buildMessage(monitor, makeCheck(), decision, "https://app.example.com");

			expect(msg.type).toBe("monitor_up");
			expect(msg.severity).toBe("success");
			expect(msg.content.title).toBe("Monitor Recovered: Test Monitor");
		});

		it("builds a threshold_breach message", () => {
			const monitor = makeMonitor({ status: "up", type: "hardware", cpuAlertThreshold: 80 });
			const decision = makeDecision({
				transition: "threshold_breach",
				thresholdBreaches: { cpu: true, memory: false, disk: false, temp: false },
			});
			const check = makeCheck({ cpu: { usage_percent: 0.9, temperature: [50] } });

			const msg = builder.buildMessage(monitor, check, decision, "https://app.example.com");

			expect(msg.type).toBe("threshold_breach");
			expect(msg.severity).toBe("warning");
			expect(msg.content.title).toBe("Threshold Exceeded: Test Monitor");
			expect(msg.content.thresholds).toBeDefined();
			expect(msg.content.thresholds!.length).toBeGreaterThan(0);
		});

		it("builds a threshold_resolved message for hardware monitor recovering", () => {
			const monitor = makeMonitor({ status: "up", type: "hardware" });
			const decision = makeDecision({ transition: "threshold_resolved" });

			const msg = builder.buildMessage(monitor, makeCheck(), decision, "https://app.example.com");

			expect(msg.type).toBe("threshold_resolved");
			expect(msg.severity).toBe("success");
			expect(msg.content.title).toBe("Thresholds Resolved: Test Monitor");
		});
	});

	// ── determineNotificationType (via buildMessage) ─────────────────────

	describe("determineNotificationType", () => {
		it("returns threshold_breach for a hardware monitor on a threshold_breach transition", () => {
			const monitor = makeMonitor({ status: "up", type: "hardware" });
			const decision = makeDecision({ transition: "threshold_breach" });

			const msg = builder.buildMessage(monitor, makeCheck(), decision, "");

			expect(msg.type).toBe("threshold_breach");
		});

		it("returns threshold_resolved for hardware monitor with threshold_resolved reason", () => {
			const monitor = makeMonitor({ status: "up", type: "hardware" });
			const decision = makeDecision({ transition: "threshold_resolved" });

			const msg = builder.buildMessage(monitor, makeCheck(), decision, "");

			expect(msg.type).toBe("threshold_resolved");
		});

		it("returns monitor_up for a hardware monitor on a status_up transition", () => {
			const monitor = makeMonitor({ status: "up", type: "hardware" });
			const decision = makeDecision({ transition: "status_up" });

			const msg = builder.buildMessage(monitor, makeCheck(), decision, "");

			expect(msg.type).toBe("monitor_up");
		});

		it("returns container_breach for docker monitor with threshold_breach reason", () => {
			const decision = makeDecision({ transition: "threshold_breach" });

			const msg = builder.buildMessage(makeDockerMonitor(), makeCheck(), decision, "");

			expect(msg.type).toBe("container_breach");
		});

		it("returns container_resolved for docker monitor with threshold_resolved reason", () => {
			const decision = makeDecision({ transition: "threshold_resolved" });

			const msg = builder.buildMessage(makeDockerMonitor({ status: "up" }), makeCheck(), decision, "");

			expect(msg.type).toBe("container_resolved");
		});

		it("returns monitor_down for a docker monitor on a status_down transition", () => {
			const decision = makeDecision({ transition: "status_down" });

			const msg = builder.buildMessage(makeDockerMonitor({ status: "down" }), makeCheck(), decision, "");

			expect(msg.type).toBe("monitor_down");
		});

		it("returns monitor_up for non-hardware monitor with status up", () => {
			const monitor = makeMonitor({ status: "up", type: "http" });
			const decision = makeDecision({ transition: "status_up" });

			const msg = builder.buildMessage(monitor, makeCheck(), decision, "");

			expect(msg.type).toBe("monitor_up");
		});

		it("returns monitor_up when there is no transition", () => {
			const monitor = makeMonitor({ status: "unknown" as any });
			const decision = makeDecision({ transition: null });

			const msg = builder.buildMessage(monitor, makeCheck(), decision, "");

			expect(msg.type).toBe("monitor_up");
		});
	});

	// ── determineSeverity (via buildMessage) ─────────────────────────────

	describe("determineSeverity", () => {
		it("returns critical for monitor_down", () => {
			const msg = builder.buildMessage(makeMonitor({ status: "down" }), makeCheck(), makeDecision(), "");
			expect(msg.severity).toBe("critical");
		});

		it("returns warning for threshold_breach", () => {
			const msg = builder.buildMessage(
				makeMonitor({ status: "up", type: "hardware" }),
				makeCheck(),
				makeDecision({ transition: "threshold_breach" }),
				""
			);
			expect(msg.severity).toBe("warning");
		});

		it("returns success for monitor_up", () => {
			const msg = builder.buildMessage(makeMonitor({ status: "up", type: "http" }), makeCheck(), makeDecision({ transition: "status_up" }), "");
			expect(msg.severity).toBe("success");
		});

		it("returns success for threshold_resolved", () => {
			const msg = builder.buildMessage(
				makeMonitor({ status: "up", type: "hardware" }),
				makeCheck(),
				makeDecision({ transition: "threshold_resolved" }),
				""
			);
			expect(msg.severity).toBe("success");
		});

		it("returns warning for container_breach", () => {
			const msg = builder.buildMessage(makeDockerMonitor(), makeCheck(), makeDecision({ transition: "threshold_breach" }), "");
			expect(msg.severity).toBe("warning");
		});

		it("returns success for container_resolved", () => {
			const msg = builder.buildMessage(makeDockerMonitor({ status: "up" }), makeCheck(), makeDecision({ transition: "threshold_resolved" }), "");
			expect(msg.severity).toBe("success");
		});
	});

	// ── buildContent variants ────────────────────────────────────────────

	describe("buildContent", () => {
		describe("monitor_down", () => {
			it("includes response code and error message when present", () => {
				const monitor = makeMonitor({ status: "down" });
				const check = makeCheck({ statusCode: 503, message: "Service Unavailable" });

				const msg = builder.buildMessage(monitor, check, makeDecision(), "");

				expect(msg.content.details).toContain("Response Code: 503");
				expect(msg.content.details).toContain("Error: Service Unavailable");
			});

			it("omits response code when falsy", () => {
				const monitor = makeMonitor({ status: "down" });
				const check = makeCheck({ statusCode: 0, message: "" });

				const msg = builder.buildMessage(monitor, check, makeDecision(), "");

				expect(msg.content.details).not.toContainEqual(expect.stringContaining("Response Code:"));
				expect(msg.content.details).not.toContainEqual(expect.stringContaining("Error:"));
			});

			it("includes URL, Status, and Type in details", () => {
				const monitor = makeMonitor({ status: "down" });
				const msg = builder.buildMessage(monitor, makeCheck(), makeDecision(), "");

				expect(msg.content.details).toContain("URL: https://example.com");
				expect(msg.content.details).toContain("Status: Down");
				expect(msg.content.details).toContain("Type: http");
			});

			it("sets summary text", () => {
				const monitor = makeMonitor({ status: "down" });
				const msg = builder.buildMessage(monitor, makeCheck(), makeDecision(), "");
				expect(msg.content.summary).toBe('Monitor "Test Monitor" is currently down and unreachable.');
			});

			it("sets timestamp", () => {
				const monitor = makeMonitor({ status: "down" });
				const msg = builder.buildMessage(monitor, makeCheck(), makeDecision(), "");
				expect(msg.content.timestamp).toBeInstanceOf(Date);
			});
		});

		describe("monitor_up", () => {
			it("includes recovery details", () => {
				const monitor = makeMonitor({ status: "up", type: "http" });
				const msg = builder.buildMessage(monitor, makeCheck(), makeDecision({ transition: "status_up" }), "");

				expect(msg.content.title).toBe("Monitor Recovered: Test Monitor");
				expect(msg.content.summary).toBe('Monitor "Test Monitor" is back up and operational.');
				expect(msg.content.details).toContain("Status: Up");
			});
		});

		describe("threshold_breach", () => {
			it("includes the breaches flagged on the decision in content", () => {
				const monitor = makeMonitor({ status: "up", type: "hardware", cpuAlertThreshold: 80 });
				const check = makeCheck({ cpu: { usage_percent: 0.9, temperature: [50] } });
				const decision = makeDecision({
					transition: "threshold_breach",
					thresholdBreaches: { cpu: true, memory: false, disk: false, temp: false },
				});

				const msg = builder.buildMessage(monitor, check, decision, "");

				expect(msg.content.thresholds).toEqual([expect.objectContaining({ metric: "cpu", currentValue: 90, threshold: 80 })]);
			});

			it("leaves thresholds empty when the decision carries no breaches", () => {
				const monitor = makeMonitor({ status: "up", type: "hardware", cpuAlertThreshold: 80 });
				const check = makeCheck({ cpu: { usage_percent: 0.9, temperature: [50] } });

				const msg = builder.buildMessage(monitor, check, makeDecision({ transition: "threshold_breach" }), "");

				expect(msg.content.thresholds).toEqual([]);
			});
		});

		describe("threshold_resolved", () => {
			it("includes resolved details", () => {
				const monitor = makeMonitor({ status: "up", type: "hardware" });
				const msg = builder.buildMessage(monitor, makeCheck(), makeDecision({ transition: "threshold_resolved" }), "");

				expect(msg.content.title).toBe("Thresholds Resolved: Test Monitor");
				expect(msg.content.summary).toBe('Monitor "Test Monitor" thresholds have returned to normal.');
				expect(msg.content.details).toContain("Status: Up");
			});
		});

		describe("container_breach", () => {
			it("lists one detail line per breaching container", () => {
				const check = makeCheck({
					status: true,
					containers: makeContainers([{ name: "db", state: "exited", exitCode: 1 }, { name: "api", health: "unhealthy" }, { name: "web" }]),
				});

				const msg = builder.buildMessage(makeDockerMonitor(), check, makeDecision({ transition: "threshold_breach" }), "");

				expect(msg.content.title).toBe("Container Alert: Test Monitor");
				expect(msg.content.summary).toBe('2 container(s) on "Test Monitor" need attention.');
				expect(msg.content.details).toEqual(["URL: unix:///var/run/docker.sock", "Type: docker", "db: stopped (exit code 1)", "api: unhealthy"]);
				expect(msg.content.thresholds).toBeUndefined();
			});

			it("only lists containers matching an enabled switch", () => {
				const check = makeCheck({
					status: true,
					containers: makeContainers([
						{ name: "db", state: "exited", exitCode: 1 },
						{ name: "api", health: "unhealthy" },
					]),
				});
				const monitor = makeDockerMonitor({ dockerAlertOnStopped: false });

				const msg = builder.buildMessage(monitor, check, makeDecision({ transition: "threshold_breach" }), "");

				expect(msg.content.details).toEqual(["URL: unix:///var/run/docker.sock", "Type: docker", "api: unhealthy"]);
			});

			it("lists no containers when the check carries no container data", () => {
				const check = makeCheck({ status: false, message: "connect ECONNREFUSED" });

				const msg = builder.buildMessage(makeDockerMonitor(), check, makeDecision({ transition: "threshold_breach" }), "");

				expect(msg.content.summary).toBe('0 container(s) on "Test Monitor" need attention.');
				expect(msg.content.details).toEqual(["URL: unix:///var/run/docker.sock", "Type: docker"]);
			});
		});

		describe("container_resolved", () => {
			it("includes recovered details", () => {
				const msg = builder.buildMessage(makeDockerMonitor({ status: "up" }), makeCheck(), makeDecision({ transition: "threshold_resolved" }), "");

				expect(msg.content.title).toBe("Containers Recovered: Test Monitor");
				expect(msg.content.summary).toBe('All containers on "Test Monitor" are back to normal.');
				expect(msg.content.details).toContain("Status: Up");
			});
		});

		describe("default content", () => {
			it("builds monitor_up content on a status_up transition", () => {
				const monitor = makeMonitor({ status: "up", type: "http" });
				const msg = builder.buildMessage(monitor, makeCheck(), makeDecision({ transition: "status_up" }), "");

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
			const result = (builder as any).buildContent("test", monitor, makeCheck());

			expect(result.title).toBe("Monitor: Test Monitor");
			expect(result.summary).toBe('Status update for monitor "Test Monitor".');
			expect(result.details).toContain("URL: https://example.com");
			expect(result.details).toContain("Status: up");
			expect(result.details).toContain("Type: http");
		});
	});

	// ── extractThresholdBreaches ─────────────────────────────────────────

	describe("extractThresholdBreaches", () => {
		const none: HardwareBreaches = { cpu: false, memory: false, disk: false, temp: false };
		const hardwareMonitor = (overrides?: Partial<Monitor>) =>
			makeMonitor({
				type: "hardware",
				cpuAlertThreshold: 80,
				memoryAlertThreshold: 70,
				diskAlertThreshold: 85,
				tempAlertThreshold: 65,
				...overrides,
			});

		it("returns empty when no breaches are supplied", () => {
			const check = makeCheck({ cpu: { usage_percent: 0.99, temperature: [99] } });

			expect(builder.extractThresholdBreaches(hardwareMonitor(), check, undefined)).toEqual([]);
		});

		it("returns empty when every flag is false, whatever the check says", () => {
			const check = makeCheck({
				cpu: { usage_percent: 0.99, temperature: [99] },
				memory: { usage_percent: 0.99 },
				disk: [{ usage_percent: 0.99 }],
			});

			expect(builder.extractThresholdBreaches(hardwareMonitor(), check, none)).toEqual([]);
		});

		it("returns empty for a non-hardware monitor even when flags are set", () => {
			const check = makeCheck({ cpu: { usage_percent: 0.99 } });

			expect(builder.extractThresholdBreaches(makeMonitor({ type: "http" }), check, { ...none, cpu: true })).toEqual([]);
		});

		// The flags are the verdict. The builder formats what it is told is breaching and never re-runs the comparison.
		it("reports a flagged metric without re-testing it against the threshold", () => {
			const check = makeCheck({ cpu: { usage_percent: 0.5, temperature: [50] } });

			const breaches = builder.extractThresholdBreaches(hardwareMonitor(), check, { ...none, cpu: true });

			expect(breaches).toEqual([{ metric: "cpu", currentValue: 50, threshold: 80, unit: "%", formattedValue: "50.0%" }]);
		});

		describe("cpu", () => {
			it("formats cpu usage as a percentage when flagged", () => {
				const check = makeCheck({ cpu: { usage_percent: 0.9, temperature: [50] } });

				const breaches = builder.extractThresholdBreaches(hardwareMonitor(), check, { ...none, cpu: true });

				expect(breaches).toEqual([{ metric: "cpu", currentValue: 90, threshold: 80, unit: "%", formattedValue: "90.0%" }]);
			});

			it("ignores cpu when not flagged", () => {
				const check = makeCheck({ cpu: { usage_percent: 0.9, temperature: [50] } });

				const breaches = builder.extractThresholdBreaches(hardwareMonitor(), check, { ...none, memory: true });

				expect(breaches.find((b) => b.metric === "cpu")).toBeUndefined();
			});
		});

		describe("memory", () => {
			it("formats memory usage as a percentage when flagged", () => {
				const check = makeCheck({ memory: { usage_percent: 0.85 } });

				const breaches = builder.extractThresholdBreaches(hardwareMonitor(), check, { ...none, memory: true });

				expect(breaches).toEqual([{ metric: "memory", currentValue: 85, threshold: 70, unit: "%", formattedValue: "85.0%" }]);
			});

			it("ignores memory when not flagged", () => {
				const check = makeCheck({ memory: { usage_percent: 0.85 } });

				const breaches = builder.extractThresholdBreaches(hardwareMonitor(), check, { ...none, cpu: true });

				expect(breaches.find((b) => b.metric === "memory")).toBeUndefined();
			});
		});

		describe("disk", () => {
			it("formats the highest usage across disks when flagged", () => {
				const check = makeCheck({ disk: [{ usage_percent: 0.5 }, { usage_percent: 0.95 }, { usage_percent: 0.7 }] });

				const breaches = builder.extractThresholdBreaches(hardwareMonitor(), check, { ...none, disk: true });

				expect(breaches).toEqual([{ metric: "disk", currentValue: 95, threshold: 85, unit: "%", formattedValue: "95.0%" }]);
			});

			it("treats a disk with no usage figure as zero when finding the highest", () => {
				const check = makeCheck({ disk: [{ usage_percent: undefined }, { usage_percent: 0.3 }] });

				const breaches = builder.extractThresholdBreaches(hardwareMonitor(), check, { ...none, disk: true });

				expect(breaches).toEqual([expect.objectContaining({ metric: "disk", currentValue: 30 })]);
			});

			it("ignores disk when not flagged", () => {
				const check = makeCheck({ disk: [{ usage_percent: 0.95 }] });

				const breaches = builder.extractThresholdBreaches(hardwareMonitor(), check, { ...none, temp: true });

				expect(breaches.find((b) => b.metric === "disk")).toBeUndefined();
			});
		});

		describe("temperature", () => {
			it("formats the highest core temperature when flagged", () => {
				const check = makeCheck({ cpu: { usage_percent: 0.5, temperature: [65, 75, 68] } });

				const breaches = builder.extractThresholdBreaches(hardwareMonitor(), check, { ...none, temp: true });

				expect(breaches).toEqual([{ metric: "temp", currentValue: 75, threshold: 65, unit: "°C", formattedValue: "75.0°C" }]);
			});

			it("ignores temperature when not flagged", () => {
				const check = makeCheck({ cpu: { usage_percent: 0.5, temperature: [99] } });

				const breaches = builder.extractThresholdBreaches(hardwareMonitor(), check, { ...none, cpu: true });

				expect(breaches.find((b) => b.metric === "temp")).toBeUndefined();
			});
		});

		describe("combined", () => {
			it("reports every flagged metric in cpu, memory, disk, temp order", () => {
				const check = makeCheck({
					cpu: { usage_percent: 0.9, temperature: [70] },
					memory: { usage_percent: 0.85 },
					disk: [{ usage_percent: 0.95 }],
				});

				const breaches = builder.extractThresholdBreaches(hardwareMonitor(), check, { cpu: true, memory: true, disk: true, temp: true });

				expect(breaches.map((b) => b.metric)).toEqual(["cpu", "memory", "disk", "temp"]);
			});

			it("reports only the flagged subset", () => {
				const check = makeCheck({
					cpu: { usage_percent: 0.9, temperature: [70] },
					memory: { usage_percent: 0.85 },
					disk: [{ usage_percent: 0.95 }],
				});

				const breaches = builder.extractThresholdBreaches(hardwareMonitor(), check, { ...none, memory: true, temp: true });

				expect(breaches.map((b) => b.metric)).toEqual(["memory", "temp"]);
			});
		});
	});

	// ── buildThresholdBreachMessage ─────────────────────────────────────────

	describe("buildThresholdBreachMessage", () => {
		const none: HardwareBreaches = { cpu: false, memory: false, disk: false, temp: false };
		const hardwareMonitor = () => makeMonitor({ type: "hardware", cpuAlertThreshold: 80, memoryAlertThreshold: 80 });

		it("describes a single flagged metric", () => {
			const check = makeCheck({ cpu: { usage_percent: 0.95, temperature: [50] } });

			const message = builder.buildThresholdBreachMessage(hardwareMonitor(), check, { ...none, cpu: true });

			expect(message).toBe("CPU: 95.0% (threshold: 80%)");
		});

		it("joins several flagged metrics with a comma", () => {
			const check = makeCheck({ cpu: { usage_percent: 0.95, temperature: [50] }, memory: { usage_percent: 0.9 } });

			const message = builder.buildThresholdBreachMessage(hardwareMonitor(), check, { ...none, cpu: true, memory: true });

			expect(message).toBe("CPU: 95.0% (threshold: 80%), MEMORY: 90.0% (threshold: 80%)");
		});

		it("falls back when no metric is flagged", () => {
			const check = makeCheck({ cpu: { usage_percent: 0.95, temperature: [50] } });

			expect(builder.buildThresholdBreachMessage(hardwareMonitor(), check, none)).toBe("Threshold breach detected");
			expect(builder.buildThresholdBreachMessage(hardwareMonitor(), check, undefined)).toBe("Threshold breach detected");
		});

		it("lists the breaching containers for a docker monitor", () => {
			const check = makeCheck({
				status: true,
				containers: makeContainers([{ name: "db", state: "exited", exitCode: 1 }, { name: "api", health: "unhealthy" }, { name: "web" }]),
			});

			const message = builder.buildThresholdBreachMessage(makeDockerMonitor(), check, undefined);

			expect(message).toBe("db: stopped (exit code 1), api: unhealthy");
		});

		it("falls back when no container is breaching", () => {
			const check = makeCheck({ status: true, containers: makeContainers([{ name: "web" }]) });

			expect(builder.buildThresholdBreachMessage(makeDockerMonitor(), check, undefined)).toBe("Container alert");
		});
	});
});
