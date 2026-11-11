const SERVICE_NAME = "PagerDutyProvider";
import got from "got";
import type { Notification } from "@/domain/notifications/notification.type.js";
import { NotificationProvider } from "@/domain/notifications/providers/INotificationProvider.js";
import type { NotificationMessage } from "@/domain/notifications/notification.type.js";
import { getTestMessage } from "@/domain/notifications/providers/utils.js";
import { AlertPagerDutyPayload } from "@/domain/notifications/notification.type.js";

const RESOLVE_TYPES: NotificationMessage["type"][] = ["monitor_up", "threshold_resolved", "container_resolved", "storage_resolved"];

export class PagerDutyProvider extends NotificationProvider {
	protected readonly serviceName = SERVICE_NAME;

	async sendTestAlert(notification: Partial<Notification>): Promise<boolean> {
		try {
			await got.post("https://events.pagerduty.com/v2/enqueue", {
				json: {
					routing_key: notification.address,
					event_action: "trigger",
					payload: {
						summary: getTestMessage(),
						severity: "info",
						source: "checkmate",
						timestamp: new Date().toISOString(),
					},
				},
				responseType: "json",
				...this.gotRequestOptions(),
			});
			return true;
		} catch (error) {
			this.logger.warn({ err: error }, "PagerDuty test alert failed");
			return false;
		}
	}

	/**
	 * New unified message format implementation
	 */
	async sendMessage(notification: Notification, message: NotificationMessage): Promise<boolean> {
		if (!notification.address) {
			this.logger.warn("PagerDuty notification missing routing key");
			return false;
		}

		// The PagerDuty alert is keyed per monitor. A recovery of one hardware problem while another keeps the monitor
		// breached must not resolve it, and a trigger would re-open it, so this one is not sent.
		if (this.isResolve(message) && message.monitor.status === "breached") {
			this.logger.debug({ monitorId: message.monitor.id, type: message.type }, "Skipping PagerDuty recovery, monitor still breached");
			return true;
		}

		try {
			const payload = this.buildPagerDutyPayload(notification, message);
			await got.post("https://events.pagerduty.com/v2/enqueue", {
				json: payload,
				...this.gotRequestOptions(),
			});
			this.logger.info("PagerDuty notification sent");
			return true;
		} catch (error) {
			this.logger.warn({ err: error }, "PagerDuty notification failed");
			return false;
		}
	}

	private isResolve(message: NotificationMessage): boolean {
		return RESOLVE_TYPES.includes(message.type);
	}

	private buildPagerDutyPayload(notification: Notification, message: NotificationMessage): AlertPagerDutyPayload {
		// Map our notification type to PagerDuty event_action
		const eventAction = this.isResolve(message) ? "resolve" : "trigger";

		// Map severity to PagerDuty severity levels
		const severityMap: Record<string, string> = {
			critical: "critical",
			warning: "warning",
			info: "info",
			success: "info",
		};

		const severity = severityMap[message.severity] || "error";

		// Build deduplication key based on monitor ID for event grouping
		const dedupKey = `checkmate-${message.monitor.id}`;

		// Build summary
		let summary = `${message.content.title} - ${message.content.summary}`;

		// Add threshold details to summary if present
		if (message.content.thresholds && message.content.thresholds.length > 0) {
			const thresholdInfo = message.content.thresholds
				.map((t) => `${t.metric.toUpperCase()}: ${t.formattedValue}/${t.threshold}${t.unit}`)
				.join(", ");
			summary += ` [${thresholdInfo}]`;
		}

		// Build custom details
		const customDetails: Record<string, unknown> = {
			monitor_name: message.monitor.name,
			monitor_url: message.monitor.url,
			monitor_type: message.monitor.type,
			monitor_status: message.monitor.status,
			notification_type: message.type,
		};

		if (message.content.thresholds && message.content.thresholds.length > 0) {
			customDetails.threshold_breaches = message.content.thresholds.map((t) => ({
				metric: t.metric,
				current: t.formattedValue,
				threshold: `${t.threshold}${t.unit}`,
			}));
		}

		if (message.content.details && message.content.details.length > 0) {
			customDetails.details = message.content.details;
		}

		return {
			routing_key: notification.address,
			dedup_key: dedupKey,
			event_action: eventAction,
			payload: {
				summary,
				severity,
				source: message.monitor.url,
				timestamp: message.content.timestamp.toISOString(),
				custom_details: customDetails,
			},
		};
	}
}
