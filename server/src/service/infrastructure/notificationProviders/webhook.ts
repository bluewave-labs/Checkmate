const SERVICE_NAME = "WebhookProvider";
import type { Monitor, Alert, Notification, MonitorStatusResponse } from "@/types/index.js";
import { INotificationProvider } from "@/service/index.js";
import type { MonitorActionDecision } from "@/service/infrastructure/SuperSimpleQueue/SuperSimpleQueueHelper.js";
import type { NotificationMessage } from "@/types/notificationMessage.js";
import { getTestMessage } from "@/service/infrastructure/notificationProviders/utils.js";
import got from "got";

export class WebhookProvider implements INotificationProvider {
	private logger: any;

	constructor(logger: any) {
		this.logger = logger;
	}

	sendMessage = async (notification: Notification, message: NotificationMessage): Promise<boolean> => {
		if (!notification.address) {
			return false;
		}

		// Build webhook payload from unified message
		const payload = this.buildWebhookPayload(message);

		try {
			await got.post(notification.address, {
				json: payload,
				headers: {
					"Content-Type": "application/json",
				},
			});
			this.logger.info({
				message: "Webhook notification sent",
				service: SERVICE_NAME,
				method: "sendMessage",
			});
			return true;
		} catch (error) {
			const err = error as Error;
			this.logger.warn({
				message: "Webhook alert failed",
				service: SERVICE_NAME,
				method: "sendMessage",
				stack: err?.stack,
			});
			return false;
		}
	};

	/**
	 * Build webhook payload from NotificationMessage
	 * Format: { text: string, severity: string, monitor: object, details: object }
	 */
	private buildWebhookPayload(message: NotificationMessage): object {
		const lines: string[] = [];

		// Title and summary
		lines.push(`**${message.content.title}**`);
		lines.push(message.content.summary);
		lines.push("");

		// Monitor information
		lines.push("**Monitor Details:**");
		lines.push(`- Name: ${message.monitor.name}`);
		lines.push(`- URL: ${message.monitor.url}`);
		lines.push(`- Type: ${message.monitor.type}`);
		lines.push(`- Status: ${message.monitor.status}`);
		lines.push("");

		// Additional details
		if (message.content.details && message.content.details.length > 0) {
			lines.push("**Additional Information:**");
			message.content.details.forEach((detail) => lines.push(`- ${detail}`));
			lines.push("");
		}

		// Threshold breaches (for hardware monitors)
		if (message.content.thresholds && message.content.thresholds.length > 0) {
			lines.push("**Threshold Breaches:**");
			message.content.thresholds.forEach((breach) => {
				lines.push(`- ${breach.metric.toUpperCase()}: ${breach.formattedValue} (threshold: ${breach.threshold}${breach.unit})`);
			});
			lines.push("");
		}

		// Incident link
		if (message.content.incident) {
			lines.push(`[View Incident](${message.clientHost}/infrastructure/${message.monitor.id})`);
		}

		// Return webhook payload with both text and structured data
		return {
			text: lines.join("\n"),
			severity: message.severity,
			type: message.type,
			monitor: {
				id: message.monitor.id,
				name: message.monitor.name,
				url: message.monitor.url,
				status: message.monitor.status,
			},
			timestamp: message.content.timestamp,
		};
	}

	sendTestAlert = async (notification: Notification) => {
		if (!notification.address) {
			return false;
		}
		try {
			await got.post(notification.address, {
				json: { text: getTestMessage() },
				headers: {
					"Content-Type": "application/json",
				},
			});
			return true;
		} catch (error) {
			const err = error as Error;
			this.logger.warn({
				message: "Webhook test alert failed",
				service: SERVICE_NAME,
				method: "sendTestAlert",
				stack: err?.stack,
			});
			return false;
		}
	};
}
