const SERVICE_NAME = "DiscordProvider";
import type { Monitor, Notification, MonitorStatusResponse } from "@/types/index.js";
import { INotificationProvider } from "@/service/index.js";
import type { MonitorActionDecision } from "@/service/infrastructure/SuperSimpleQueue/SuperSimpleQueueHelper.js";
import { buildHardwareAlerts, buildDiscordBody, getTestMessage } from "@/service/infrastructure/notificationProviders/utils.js";
import type { NotificationMessage } from "@/types/notificationMessage.js";
import got from "got";

export class DiscordProvider implements INotificationProvider {
	private logger: any;

	constructor(logger: any) {
		this.logger = logger;
	}
	private getHardwareContent = (
		clientHost: string,
		monitor: Monitor,
		monitorStatusResponse: MonitorStatusResponse,
		decision: MonitorActionDecision
	) => {
		// For status changes (recovery), use standard format
		if (decision.notificationReason === "status_change") {
			return buildDiscordBody(monitor, monitorStatusResponse);
		}
		// For threshold breaches, use hardware alert format
		const { discordPayload } = buildHardwareAlerts(clientHost, monitor, monitorStatusResponse);
		return discordPayload;
	};

	sendAlert = async (
		notification: Notification,
		monitor: Monitor,
		monitorStatusResponse: MonitorStatusResponse,
		decision: MonitorActionDecision,
		clientHost: string
	) => {
		let body;
		if (monitor.type === "hardware") {
			body = this.getHardwareContent(clientHost, monitor, monitorStatusResponse, decision);
		} else {
			body = buildDiscordBody(monitor, monitorStatusResponse);
		}

		if (!notification.address) {
			return false;
		}

		try {
			await got.post(notification.address, {
				json: body,
				headers: {
					"Content-Type": "application/json",
				},
			});
			return true;
		} catch (error) {
			const err = error as Error;
			this.logger.warn({
				message: "Discord alert failed",
				service: SERVICE_NAME,
				method: "sendAlert",
				stack: err?.stack,
			});
			return false;
		}
	};
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

	/**
	 * New unified message format implementation
	 */
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
			this.logger.info({
				message: "[NEW] Discord notification sent via sendMessage",
				service: SERVICE_NAME,
				method: "sendMessage",
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

	private buildDiscordEmbed(message: NotificationMessage): any {
		// Map severity to Discord embed colors
		const colorMap: Record<string, number> = {
			critical: 0xdc2626, // red-600
			warning: 0xf59e0b, // amber-500
			info: 0x3b82f6, // blue-500
			success: 0x10b981, // green-500
		};

		const color = colorMap[message.severity] || colorMap.info;

		const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

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
