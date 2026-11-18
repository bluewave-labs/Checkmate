const SERVICE_NAME = "DiscordProvider";
import type { AlertDiscordPayload, DiscordEmbedField, Notification } from "@/domain/notifications/notification.type.js";
import { NotificationProvider } from "@/domain/notifications/providers/INotificationProvider.js";
import { decodeHtmlEntities, getTestMessage } from "@/domain/notifications/providers/utils.js";
import type { NotificationMessage, NotificationSeverity } from "@/domain/notifications/notification.type.js";
import got from "got";

export class DiscordProvider extends NotificationProvider {
	protected readonly serviceName = SERVICE_NAME;

	sendTestAlert = async (notification: Partial<Notification>) => {
		if (!notification.address) {
			return false;
		}
		// Include the ping line so the Test button verifies mentions too.
		const pingContent = notification.pingContent?.trim() ? decodeHtmlEntities(notification.pingContent) : undefined;
		const content = pingContent ? `${pingContent}\n${getTestMessage()}` : getTestMessage();
		try {
			await got.post(notification.address, {
				json: { content, allowed_mentions: { parse: ["users", "roles", "everyone"] } },
				headers: {
					"Content-Type": "application/json",
				},
				...this.gotRequestOptions(),
			});
			return true;
		} catch (error) {
			this.logger.warn({ err: error }, "Discord test alert failed");
			return false;
		}
	};

	async sendMessage(notification: Notification, message: NotificationMessage): Promise<boolean> {
		if (!notification.address) {
			this.logger.warn("Discord notification missing webhook URL");
			return false;
		}

		const embed = this.buildDiscordEmbed(message);
		// Plain-text ping outside the embed: mentions here always resolve, unlike inside embeds.
		const pingContent = notification.pingContent?.trim() ? this.renderTemplate(decodeHtmlEntities(notification.pingContent), message) : undefined;
		this.logger.debug({
			message: "Sending Discord notification",
			service: SERVICE_NAME,
			method: "sendMessage",
			details: { hasPingContent: Boolean(pingContent) },
		});

		try {
			await got.post(notification.address, {
				// allowed_mentions makes <@user> / <@&role> in the description ping. Mentions in the embed title never render.
				json: {
					...(pingContent ? { content: pingContent } : {}),
					embeds: [embed],
					allowed_mentions: { parse: ["users", "roles", "everyone"] },
				},
				headers: {
					"Content-Type": "application/json",
				},
				...this.gotRequestOptions(),
			});
			return true;
		} catch (error) {
			this.logger.warn({ err: error }, "Discord notification failed");
			return false;
		}
	}

	private renderTemplate(template: string, message: NotificationMessage): string {
		return template
			.replaceAll("{{monitor_name}}", message.monitor.name)
			.replaceAll("{{monitor_url}}", message.monitor.url)
			.replaceAll("{{monitor_type}}", message.monitor.type)
			.replaceAll("{{status}}", message.monitor.status);
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
		if (message.monitor.url) {
			fields.push({
				name: "URL",
				value: message.monitor.url,
				inline: false,
			});
		}

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
