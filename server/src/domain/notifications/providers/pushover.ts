const SERVICE_NAME = "PushoverProvider";
import type { Notification } from "@/domain/notifications/notification.type.js";
import { NotificationProvider } from "@/domain/notifications/providers/INotificationProvider.js";
import type { NotificationMessage } from "@/domain/notifications/notification.type.js";
import { getTestMessage, incidentUrl } from "@/domain/notifications/providers/utils.js";
import got from "got";

export class PushoverProvider extends NotificationProvider {
	protected readonly serviceName = SERVICE_NAME;

	async sendTestAlert(notification: Partial<Notification>): Promise<boolean> {
		if (!notification.address || !notification.accessToken) {
			return false;
		}

		try {
			await got.post("https://api.pushover.net/1/messages.json", {
				form: {
					token: notification.accessToken,
					user: notification.address,
					message: getTestMessage(),
					title: "Checkmate Test Notification",
				},
				...this.gotRequestOptions(),
			});
			return true;
		} catch (error) {
			this.logger.warn({ err: error }, "Pushover test alert failed");
			return false;
		}
	}

	async sendMessage(notification: Notification, message: NotificationMessage): Promise<boolean> {
		if (!notification.address || !notification.accessToken) {
			return false;
		}

		const text = this.buildPushoverText(message);

		try {
			await got.post("https://api.pushover.net/1/messages.json", {
				form: {
					token: notification.accessToken,
					user: notification.address,
					message: text,
					title: message.content.title,
				},
				...this.gotRequestOptions(),
			});

			this.logger.info("Pushover notification sent");
			return true;
		} catch (error) {
			this.logger.warn({ err: error }, "Pushover alert failed");
			return false;
		}
	}

	private buildPushoverText(message: NotificationMessage): string {
		const lines: string[] = [];

		lines.push(message.content.summary);
		lines.push("");
		lines.push("Monitor Details:");
		lines.push(`• Name: ${message.monitor.name}`);
		lines.push(`• URL: ${message.monitor.url}`);
		lines.push(`• Type: ${message.monitor.type}`);
		lines.push(`• Status: ${message.monitor.status}`);

		if (message.content.details && message.content.details.length > 0) {
			lines.push("");
			lines.push("Additional Information:");
			message.content.details.forEach((detail) => lines.push(`• ${detail}`));
		}

		if (message.content.thresholds && message.content.thresholds.length > 0) {
			lines.push("");
			lines.push("Threshold Breaches:");
			message.content.thresholds.forEach((breach) => {
				lines.push(`• ${breach.metric.toUpperCase()}: ${breach.formattedValue} (threshold: ${breach.threshold}${breach.unit})`);
			});
		}

		if (message.content.incident) {
			lines.push("");
			lines.push(`View Incident: ${incidentUrl(message)}`);
		}

		return lines.join("\n");
	}
}
