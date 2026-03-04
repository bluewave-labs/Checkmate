const SERVICE_NAME = "DiscordProvider";
import type { AlertDiscordPayload, DiscordEmbedField, Notification } from "@/types/index.js";
import { INotificationProvider } from "@/service/index.js";
import { getTestMessage } from "@/service/infrastructure/notificationProviders/utils.js";
import type { NotificationMessage, NotificationSeverity } from "@/types/notificationMessage.js";
import got from "got";
import { ILogger } from "@/utils/logger.js";

export class DiscordProvider implements INotificationProvider {
	private logger: ILogger;

	constructor(logger: ILogger) {
		this.logger = logger;
	}

	sendTestAlert = async (notification: Notification) => {
		if (!notification.address) {
			return false;
		}
		try {
			await got.post(notification.address, {
				json: { content: getTestMessage() },
				headers: {
					"Content-Type": "application/json",
				},
			});
			return true;
		} catch (error) {
			const err = error as Error;
			this.logger.warn({
				message: "Discord test alert failed",
				service: SERVICE_NAME,
				method: "sendTestAlert",
				stack: err?.stack,
			});
			return false;
		}
	};

	async sendMessage(notification: Notification, message: NotificationMessage): Promise<boolean> {
		if (!notification.address) {
			this.logger.warn({
				message: "Discord notification missing webhook URL",
				service: SERVICE_NAME,
				method: "sendMessage",
			});
			return false;
		}

		const embed = this.buildDiscordEmbed(message);

		try {
			await got.post(notification.address, {
				json: { embeds: [embed] },
				headers: {
					"Content-Type": "application/json",
				},
			});
			return true;
		} catch (error) {
			const err = error as Error;
			this.logger.warn({
				message: "Discord notification failed",
				service: SERVICE_NAME,
				method: "sendMessage",
				stack: err?.stack,
			});
			return false;
		}
	}

	private buildDiscordEmbed(message: NotificationMessage): AlertDiscordPayload {
		const colorMap: Record<NotificationSeverity, number> = {
			critical: 0xdc2626, // red-600
			warning: 0xf59e0b, // amber-500
			info: 0x3b82f6, // blue-500
			success: 0x10b981, // green-500
		};

		const color = colorMap[message.severity] ?? colorMap.info;

		const fields: Array<DiscordEmbedField> = [];

		// Add monitor details
		fields.push({
			name: "Monitor",
			value: message.monitor.name,
			inline: true,
		});

		fields.push({
			name: "Type",
			value: message.monitor.type.toUpperCase(),
			inline: true,
		});

		fields.push({
			name: "Status",
			value: message.monitor.status.charAt(0).toUpperCase() + message.monitor.status.slice(1),
			inline: true,
		});

		// Add monitor URL
		fields.push({
			name: "URL",
			value: message.monitor.url,
			inline: false,
		});

		// Add threshold breaches if present
		if (message.content.thresholds && message.content.thresholds.length > 0) {
			const thresholdLines = message.content.thresholds
				.map((t) => `• **${t.metric.toUpperCase()}**: ${t.formattedValue} (threshold: ${t.threshold}${t.unit})`)
				.join("\n");

			fields.push({
				name: "Threshold Breaches",
				value: thresholdLines,
				inline: false,
			});
		}

		// Add details if present
		if (message.content.details && message.content.details.length > 0) {
			const detailsText = message.content.details.join("\n");
			fields.push({
				name: "Details",
				value: detailsText,
				inline: false,
			});
		}

		return {
			title: message.content.title,
			description: message.content.summary,
			color,
			fields,
			timestamp: message.content.timestamp.toISOString(),
		};
	}
}
