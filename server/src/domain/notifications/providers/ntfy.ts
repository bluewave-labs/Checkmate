const SERVICE_NAME = "NtfyProvider";
import type { Notification } from "@/domain/notifications/notification.type.js";
import { NotificationProvider } from "@/domain/notifications/providers/INotificationProvider.js";
import type { NotificationMessage } from "@/domain/notifications/notification.type.js";
import { getTestMessage } from "@/domain/notifications/providers/utils.js";
import got from "got";

export class NtfyProvider extends NotificationProvider {
	async sendTestAlert(notification: Partial<Notification>): Promise<boolean> {
		if (!notification.address || !notification.topic) {
			return false;
		}

		try {
			await got.post(this.buildTopicUrl(notification.address, notification.topic), {
				body: getTestMessage(),
				headers: {
					Title: "Checkmate test notification",
					Priority: "default",
				},
				...this.gotRequestOptions(),
			});
			return true;
		} catch (error) {
			const err = error as Error;
			this.logger.warn({
				message: "ntfy test alert failed",
				service: SERVICE_NAME,
				method: "sendTestAlert",
				stack: err?.stack,
			});
			return false;
		}
	}

	async sendMessage(notification: Notification, message: NotificationMessage): Promise<boolean> {
		if (!notification.address || !notification.topic) {
			return false;
		}

		try {
			await got.post(this.buildTopicUrl(notification.address, notification.topic), {
				body: this.buildNtfyText(message),
				headers: {
					Title: message.content.title,
					Priority: this.mapPriority(message.severity),
					Tags: this.mapTags(message.severity),
				},
				...this.gotRequestOptions(),
			});
			this.logger.info({
				message: "ntfy notification sent",
				service: SERVICE_NAME,
				method: "sendMessage",
			});
			return true;
		} catch (error) {
			const err = error as Error;
			this.logger.warn({
				message: "ntfy alert failed",
				service: SERVICE_NAME,
				method: "sendMessage",
				stack: err?.stack,
			});
			return false;
		}
	}

	private buildTopicUrl(address: string, topic: string): string {
		return `${address.replace(/\/+$/, "")}/${encodeURIComponent(topic)}`;
	}

	private buildNtfyText(message: NotificationMessage): string {
		const lines = [
			message.content.summary,
			"",
			"Monitor Details:",
			`- Name: ${message.monitor.name}`,
			`- URL: ${message.monitor.url}`,
			`- Type: ${message.monitor.type}`,
			`- Status: ${message.monitor.status}`,
		];

		if (message.content.details && message.content.details.length > 0) {
			lines.push("", "Additional Information:");
			message.content.details.forEach((detail) => lines.push(`- ${detail}`));
		}

		if (message.content.thresholds && message.content.thresholds.length > 0) {
			lines.push("", "Threshold Breaches:");
			message.content.thresholds.forEach((breach) => {
				lines.push(`- ${breach.metric.toUpperCase()}: ${breach.formattedValue} (threshold: ${breach.threshold}${breach.unit})`);
			});
		}

		if (message.content.incident) {
			lines.push("", `${message.clientHost}/infrastructure/${message.monitor.id}`);
		}

		return lines.join("\n");
	}

	private mapPriority(severity: NotificationMessage["severity"]): string {
		switch (severity) {
			case "critical":
				return "high";
			case "warning":
				return "default";
			case "success":
				return "low";
			default:
				return "default";
		}
	}

	private mapTags(severity: NotificationMessage["severity"]): string {
		switch (severity) {
			case "critical":
				return "rotating_light";
			case "warning":
				return "warning";
			case "success":
				return "white_check_mark";
			default:
				return "information_source";
		}
	}
}
