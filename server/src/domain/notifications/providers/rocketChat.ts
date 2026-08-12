const SERVICE_NAME = "RocketChatProvider";
import type { Notification, NotificationMessage } from "@/domain/notifications/notification.type.js";
import { NotificationProvider } from "@/domain/notifications/providers/INotificationProvider.js";
import { getTestMessage } from "@/domain/notifications/providers/utils.js";
import got from "got";

export class RocketChatProvider extends NotificationProvider {
	async sendTestAlert(notification: Partial<Notification>): Promise<boolean> {
		if (!notification.address) {
			return false;
		}

		try {
			await got.post(notification.address, {
				json: { text: getTestMessage() },
				headers: {
					"Content-Type": "application/json",
				},
				...this.gotRequestOptions(),
			});
			return true;
		} catch (error) {
			const err = error as Error;
			this.logger.warn({
				message: "Rocket.Chat test alert failed",
				service: SERVICE_NAME,
				method: "sendTestAlert",
				stack: err?.stack,
			});
			return false;
		}
	}

	async sendMessage(notification: Notification, message: NotificationMessage): Promise<boolean> {
		if (!notification.address) {
			return false;
		}

		try {
			await got.post(notification.address, {
				json: { text: this.buildText(message) },
				headers: {
					"Content-Type": "application/json",
				},
				...this.gotRequestOptions(),
			});
			return true;
		} catch (error) {
			const err = error as Error;
			this.logger.warn({
				message: "Rocket.Chat notification failed",
				service: SERVICE_NAME,
				method: "sendMessage",
				stack: err?.stack,
			});
			return false;
		}
	}

	private buildText(message: NotificationMessage): string {
		const lines = [
			message.content.title,
			message.content.summary,
			"",
			`Monitor: ${message.monitor.name}`,
			`Type: ${message.monitor.type}`,
			`Status: ${message.monitor.status}`,
			`URL: ${message.monitor.url}`,
		];

		if (message.content.details?.length) {
			lines.push("", "Details:", ...message.content.details.map((detail) => `- ${detail}`));
		}
		if (message.content.thresholds?.length) {
			lines.push(
				"",
				"Thresholds:",
				...message.content.thresholds.map(
					(threshold) => `- ${threshold.metric.toUpperCase()}: ${threshold.formattedValue} (threshold: ${threshold.threshold}${threshold.unit})`
				)
			);
		}

		if (message.content.incident) {
			lines.push("", `Incident: ${message.clientHost}/infrastructure/${message.monitor.id}`);
		}

		return lines.join("\n");
	}
}
