const SERVICE_NAME = "TelegramProvider";
import type { Notification } from "@/types/index.js";
import { NotificationProvider } from "@/service/index.js";
import type { NotificationMessage } from "@/types/notificationMessage.js";
import { getTestMessage } from "@/service/infrastructure/notificationProviders/utils.js";
import got from "got";

export class TelegramProvider extends NotificationProvider {
	async sendTestAlert(notification: Partial<Notification>): Promise<boolean> {
		if (!notification.address || !notification.accessToken) {
			return false;
		}

		try {
			await got.post(`https://api.telegram.org/bot${notification.accessToken}/sendMessage`, {
				json: {
					chat_id: notification.address,
					text: getTestMessage(),
					parse_mode: "HTML",
				},
				...this.gotRequestOptions(),
			});
			return true;
		} catch (error) {
			const errMsg = error instanceof Error ? error.message : "unknown error";
			const errStack = error instanceof Error ? error.stack : undefined;
			this.logger.warn({
				message: "Telegram test alert failed",
				service: SERVICE_NAME,
				method: "sendTestAlert",
				stack: errStack,
				details: { error: errMsg },
			});
			return false;
		}
	}

	async sendMessage(notification: Notification, message: NotificationMessage): Promise<boolean> {
		if (!notification.address || !notification.accessToken) {
			return false;
		}

		const text = this.buildTelegramText(message);

		try {
			await got.post(`https://api.telegram.org/bot${notification.accessToken}/sendMessage`, {
				json: {
					chat_id: notification.address,
					text,
					parse_mode: "HTML",
				},
				...this.gotRequestOptions(),
			});

			this.logger.info({
				message: "Telegram notification sent",
				service: SERVICE_NAME,
				method: "sendMessage",
			});
			return true;
		} catch (error) {
			const errMsg = error instanceof Error ? error.message : "unknown error";
			const errStack = error instanceof Error ? error.stack : undefined;
			this.logger.warn({
				message: "Telegram alert failed",
				service: SERVICE_NAME,
				method: "sendMessage",
				stack: errStack,
				details: { error: errMsg },
			});
			return false;
		}
	}

	private buildTelegramText(message: NotificationMessage): string {
		const lines: string[] = [];

		lines.push(`<b>${message.content.title}</b>`);
		lines.push(message.content.summary);
		lines.push("");

		lines.push("<b>Monitor Details:</b>");
		lines.push(`• Name: ${message.monitor.name}`);
		lines.push(`• URL: ${message.monitor.url}`);
		lines.push(`• Type: ${message.monitor.type}`);
		lines.push(`• Status: ${message.monitor.status}`);

		if (message.content.details && message.content.details.length > 0) {
			lines.push("");
			lines.push("<b>Additional Information:</b>");
			message.content.details.forEach((detail) => lines.push(`• ${detail}`));
		}

		if (message.content.thresholds && message.content.thresholds.length > 0) {
			lines.push("");
			lines.push("<b>Threshold Breaches:</b>");
			message.content.thresholds.forEach((breach) => {
				lines.push(`• ${breach.metric.toUpperCase()}: ${breach.formattedValue} (threshold: ${breach.threshold}${breach.unit})`);
			});
		}

		if (message.content.incident) {
			lines.push("");
			lines.push(`<a href="${message.clientHost}/incidents/${message.monitor.id}">View Incident</a>`);
		}

		return lines.join("\n");
	}
}
