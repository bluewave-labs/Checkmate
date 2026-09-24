import { HardwareMetricKeys, type HardwareBreaches, type HardwareMetricKey, type Monitor } from "@/domain/monitors/monitor.type.js";
import type { MonitorActionDecision } from "@/worker/worker.interface.js";
import type {
	NotificationMessage,
	NotificationType,
	NotificationSeverity,
	ThresholdBreach,
	NotificationContent,
} from "@/domain/notifications/notification.type.js";
import { describeContainerBreach, findContainerBreaches } from "@/domain/docker/docker-alert.js";
import type { Check } from "@/domain/checks/check.type.js";

export interface INotificationMessageBuilder {
	buildMessage(monitor: Monitor, check: Check, decision: MonitorActionDecision, clientHost: string): NotificationMessage;
	extractThresholdBreaches(monitor: Monitor, check: Check, thresholdBreaches: HardwareBreaches | undefined): ThresholdBreach[];
}

const SERVICE_NAME = "NotificationMessageBuilder";

export class NotificationMessageBuilder implements INotificationMessageBuilder {
	static SERVICE_NAME = SERVICE_NAME;

	buildMessage(monitor: Monitor, check: Check, decision: MonitorActionDecision, clientHost: string): NotificationMessage {
		const type = this.determineNotificationType(decision, monitor);
		const severity = this.determineSeverity(type);
		const content = this.buildContent(type, monitor, check, decision);

		return {
			type,
			severity,
			monitor: {
				id: monitor.id,
				name: monitor.name,
				url: monitor.url,
				type: monitor.type,
				status: monitor.status,
			},
			content,
			clientHost,
			metadata: {
				teamId: monitor.teamId,
				notificationReason: decision.notificationReason || "status_change",
			},
		};
	}

	private determineNotificationType(decision: MonitorActionDecision, monitor: Monitor): NotificationType {
		// Down status has highest priority (critical)
		if (monitor.status === "down") {
			return "monitor_down";
		}

		const isDocker = monitor.type === "docker";
		switch (decision.notificationReason) {
			case "threshold_breach":
				return isDocker ? "container_breach" : "threshold_breach";
			case "threshold_resolved":
				return isDocker ? "container_resolved" : "threshold_resolved";
			default:
				return "monitor_up";
		}
	}

	private determineSeverity(type: NotificationType): NotificationSeverity {
		switch (type) {
			case "monitor_up":
				return "success";
			case "monitor_down":
				return "critical";
			case "container_breach":
				return "warning";
			case "threshold_breach":
				return "warning";
			case "container_resolved":
				return "success";
			case "threshold_resolved":
				return "success";
			case "test":
				return "info";
			default:
				return "info";
		}
	}

	private buildContent(type: NotificationType, monitor: Monitor, check: Check, decision: MonitorActionDecision): NotificationContent {
		switch (type) {
			case "monitor_down":
				return this.buildMonitorDownContent(monitor, check);
			case "monitor_up":
				return this.buildMonitorUpContent(monitor);
			case "threshold_breach":
				return this.buildThresholdBreachContent(monitor, check, decision.thresholdBreaches);
			case "threshold_resolved":
				return this.buildThresholdResolvedContent(monitor);
			case "container_breach":
				return this.buildContainerBreachContent(monitor, check);
			case "container_resolved":
				return this.buildContainersRecoveredContent(monitor);
			default:
				return this.buildDefaultContent(monitor);
		}
	}

	private buildMonitorDownContent(monitor: Monitor, check: Check): NotificationContent {
		const title = `Monitor Down: ${monitor.name}`;
		const summary = `Monitor "${monitor.name}" is currently down and unreachable.`;
		const details = [`URL: ${monitor.url}`, `Status: Down`, `Type: ${monitor.type}`];

		// Add response code if available
		if (check.statusCode) {
			details.push(`Response Code: ${check.statusCode}`);
		}

		// Add error message if available
		if (check.message) {
			details.push(`Error: ${check.message}`);
		}

		return {
			title,
			summary,
			details,
			timestamp: new Date(),
		};
	}

	private buildMonitorUpContent(monitor: Monitor): NotificationContent {
		const title = `Monitor Recovered: ${monitor.name}`;
		const summary = `Monitor "${monitor.name}" is back up and operational.`;
		const details = [`URL: ${monitor.url}`, `Status: Up`, `Type: ${monitor.type}`];

		return {
			title,
			summary,
			details,
			timestamp: new Date(),
		};
	}

	private buildThresholdBreachContent(monitor: Monitor, check: Check, thresholdBreaches: HardwareBreaches | undefined): NotificationContent {
		const title = `Threshold Exceeded: ${monitor.name}`;
		const summary = `Monitor "${monitor.name}" has exceeded one or more thresholds.`;
		const details = [`URL: ${monitor.url}`, `Status: Threshold exceeded`, `Type: ${monitor.type}`];

		const thresholds = this.extractThresholdBreaches(monitor, check, thresholdBreaches);

		return {
			title,
			summary,
			details,
			thresholds,
			timestamp: new Date(),
		};
	}

	private buildThresholdResolvedContent(monitor: Monitor): NotificationContent {
		const title = `Thresholds Resolved: ${monitor.name}`;
		const summary = `Monitor "${monitor.name}" thresholds have returned to normal.`;
		const details = [`URL: ${monitor.url}`, `Status: Up`, `Type: ${monitor.type}`];

		return {
			title,
			summary,
			details,
			timestamp: new Date(),
		};
	}

	private buildContainerBreachContent(monitor: Monitor, check: Check): NotificationContent {
		const containers = check.containers ?? [];
		const breaches = findContainerBreaches(monitor, containers);
		const title = `Container Alert: ${monitor.name}`;
		const summary = `${breaches.length} container(s) on "${monitor.name}" need attention.`;
		const details = [`URL: ${monitor.url}`, `Type: ${monitor.type}`, ...breaches.map(describeContainerBreach)];
		return { title, summary, details, timestamp: new Date() };
	}

	private buildContainersRecoveredContent(monitor: Monitor): NotificationContent {
		const title = `Containers Recovered: ${monitor.name}`;
		const summary = `All containers on "${monitor.name}" are back to normal.`;
		const details = [`URL: ${monitor.url}`, `Status: Up`, `Type: ${monitor.type}`];
		return { title, summary, details, timestamp: new Date() };
	}

	private buildDefaultContent(monitor: Monitor): NotificationContent {
		return {
			title: `Monitor: ${monitor.name}`,
			summary: `Status update for monitor "${monitor.name}".`,
			details: [`URL: ${monitor.url}`, `Status: ${monitor.status}`, `Type: ${monitor.type}`],
			timestamp: new Date(),
		};
	}

	private describeBreach(metric: HardwareMetricKey, monitor: Monitor, check: Check): ThresholdBreach {
		switch (metric) {
			case "cpu": {
				const currentValue = (check.cpu?.usage_percent ?? 0) * 100;
				return { metric, currentValue, threshold: monitor.cpuAlertThreshold, unit: "%", formattedValue: `${currentValue.toFixed(1)}%` };
			}
			case "memory": {
				const currentValue = (check.memory?.usage_percent ?? 0) * 100;
				return { metric, currentValue, threshold: monitor.memoryAlertThreshold, unit: "%", formattedValue: `${currentValue.toFixed(1)}%` };
			}
			case "disk": {
				const currentValue = Math.max(0, ...(check.disk ?? []).map((disk) => disk?.usage_percent ?? 0)) * 100;
				return { metric, currentValue, threshold: monitor.diskAlertThreshold, unit: "%", formattedValue: `${currentValue.toFixed(1)}%` };
			}
			case "temp": {
				const currentValue = Math.max(0, ...(check.cpu?.temperature ?? []));
				return { metric, currentValue, threshold: monitor.tempAlertThreshold, unit: "°C", formattedValue: `${currentValue.toFixed(1)}°C` };
			}
		}
	}

	public extractThresholdBreaches(monitor: Monitor, check: Check, thresholdBreaches: HardwareBreaches | undefined): ThresholdBreach[] {
		const breaches: ThresholdBreach[] = [];

		// Check if this is a hardware monitor with threshold data
		if (monitor.type !== "hardware" || thresholdBreaches === undefined) {
			return breaches;
		}

		for (const metric of HardwareMetricKeys) {
			if (!thresholdBreaches[metric]) continue;
			breaches.push(this.describeBreach(metric, monitor, check));
		}

		return breaches;
	}
}
