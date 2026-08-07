const SERVICE_NAME = "RocketChatProvider";
import type { Notification, NotificationMessage } from "@/domain/notifications/notification.type.js";
import { NotificationProvider } from "@/domain/notifications/providers/INotificationProvider.js";
import { getTestMessage } from "@/domain/notifications/providers/utils.js";
import got from "got";

type RocketChatField = { title: string; value: string; short: boolean };
type RocketChatAttachment = {
	color: string;
	title: string;
	title_link?: string;
	fields?: RocketChatField[];
	ts?: string;
};
type RocketChatPayload = { text: string; attachments: [RocketChatAttachment] };

export class RocketChatProvider extends NotificationProvider {
	async sendTestAlert(notification: Partial<Notification>): Promise<boolean> {
		if (!notification.address) {
			return false;
		}

		try {
			await got.post(notification.address, {
				json: this.buildTestPayload(),
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

	private buildTestPayload(): RocketChatPayload {
		return {
			text: getTestMessage(),
			attachments: [
				{
					color: "#0000FF",
					title: "Checkmate test notification",
					fields: [
						{ title: "Channel", value: "Rocket.Chat", short: true },
						{ title: "Status", value: "Test notification", short: true },
					],
				},
			],
		};
	}

	async sendMessage(notification: Notification, message: NotificationMessage): Promise<boolean> {
		if (!notification.address) {
			return false;
		}

		try {
			await got.post(notification.address, {
				json: this.buildPayload(message),
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

	private buildPayload(message: NotificationMessage): RocketChatPayload {
		const fields: RocketChatField[] = [
			{ title: "Monitor", value: message.monitor.name, short: true },
			{ title: "Type", value: message.monitor.type, short: true },
			{ title: "Status", value: message.monitor.status, short: true },
			{ title: "URL", value: message.monitor.url, short: false },
		];

		if (message.content.thresholds?.length) {
			fields.push(
				...message.content.thresholds.map((breach) => ({
					title: breach.metric.toUpperCase(),
					value: `${breach.formattedValue} (threshold: ${breach.threshold}${breach.unit})`,
					short: true,
				}))
			);
		}

		if (message.content.details?.length) {
			fields.push({
				title: "Details",
				value: message.content.details.map((detail) => `- ${detail}`).join("\n"),
				short: false,
			});
		}

		if (message.content.incident?.url.trim()) {
			fields.push({
				title: "Incident",
				value: message.content.incident.url,
				short: false,
			});
		}

		return {
			text: message.content.summary,
			attachments: [
				{
					color: this.severityColor(message.severity),
					title: message.content.title,
					title_link: `${message.clientHost}/infrastructure/${message.monitor.id}`,
					fields,
					ts: message.content.timestamp.toISOString(),
				},
			],
		};
	}

	private severityColor(severity: NotificationMessage["severity"]): string {
		switch (severity) {
			case "critical":
				return "#FF0000";
			case "warning":
				return "#FFA500";
			case "success":
				return "#00FF00";
			case "info":
				return "#0000FF";
			default:
				return "#808080";
		}
	}
}
