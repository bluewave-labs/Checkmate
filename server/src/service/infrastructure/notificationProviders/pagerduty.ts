const SERVICE_NAME = "PagerDutyProvider";
import got from "got";
import type { Notification } from "@/types/index.js";
import { NotificationProvider } from "@/service/infrastructure/notificationProviders/INotificationProvider.js";
import type { NotificationMessage } from "@/types/notificationMessage.js";
import { getTestMessage } from "@/service/infrastructure/notificationProviders/utils.js";
import { AlertPagerDutyPayload } from "@/types/index.js";

export class PagerDutyProvider extends NotificationProvider {
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
			const err = error as Error;
			this.logger.warn({
				message: "PagerDuty test alert failed",
				service: SERVICE_NAME,
				method: "sendTestAlert",
				stack: err?.stack,
			});
			return false;
		}
	}

	/**
	 * New unified message format implementation
	 */
	async sendMessage(notification: Notification, message: NotificationMessage): Promise<boolean> {
		if (!notification.address) {
			this.logger.warn({
				message: "PagerDuty notification missing routing key",
				service: SERVICE_NAME,
				method: "sendMessage",
			});
			return false;
		}

		try {
			const payload = this.buildPagerDutyPayload(notification, message);
			await got.post("https://events.pagerduty.com/v2/enqueue", {
				json: payload,
				...this.gotRequestOptions(),
			});
			this.logger.info({
				message: "[NEW] PagerDuty notification sent via sendMessage",
				service: SERVICE_NAME,
				method: "sendMessage",
			});
			return true;
		} catch (error) {
			const err = error as Error;
			this.logger.warn({
				message: "PagerDuty notification failed",
				service: SERVICE_NAME,
				method: "sendMessage",
				stack: err?.stack,
			});
			return false;
		}
	}

	private buildPagerDutyPayload(notification: Notification, message: NotificationMessage): AlertPagerDutyPayload {
		// Map our notification type to PagerDuty event_action
		const eventAction = message.type === "monitor_up" || message.type === "threshold_resolved" ? "resolve" : "trigger";

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
