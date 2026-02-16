const SERVICE_NAME = "SlackProvider";
import type { Monitor, Notification, MonitorStatusResponse } from "@/types/index.js";
import { INotificationProvider } from "@/service/index.js";
import type { MonitorActionDecision } from "@/service/infrastructure/SuperSimpleQueue/SuperSimpleQueueHelper.js";
import type { NotificationMessage } from "@/types/notificationMessage.js";
import {
	buildHardwareAlerts,
	buildHardwareNotificationMessage,
	buildWebhookBody,
	getTestMessage,
} from "@/service/infrastructure/notificationProviders/utils.js";
import got, { HTTPError } from "got";

export class SlackProvider implements INotificationProvider {
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
			return buildWebhookBody(monitor, monitorStatusResponse);
		}
		// For threshold breaches, use hardware alert format
		const { alertsToSend } = buildHardwareAlerts(clientHost, monitor, monitorStatusResponse);
		const body = buildHardwareNotificationMessage(clientHost, alertsToSend, monitor);
		return body;
	};

	private getContent = (monitor: Monitor, monitorStatusResponse: MonitorStatusResponse) => {
		const body = buildWebhookBody(monitor, monitorStatusResponse);
		return body;
	};

	async sendAlert(
		notification: Notification,
		monitor: Monitor,
		monitorStatusResponse: MonitorStatusResponse,
		decision: MonitorActionDecision,
		clientHost: string
	): Promise<boolean> {
		let body;
		if (monitor.type === "hardware") {
			body = this.getHardwareContent(clientHost, monitor, monitorStatusResponse, decision);
		} else {
			body = this.getContent(monitor, monitorStatusResponse);
		}

		if (!notification.address) {
			return false;
		}

		try {
			await got.post(notification.address, {
				json: { text: body },
				headers: {
					"Content-Type": "application/json",
				},
			});
			return true;
		} catch (error) {
			const err = error as Error;
			this.logger.warn({
				message: "Slack alert failed",
				service: SERVICE_NAME,
				method: "sendAlert",
				stack: err?.stack,
			});
			return false;
		}
	}

	async sendTestAlert(notification: Notification): Promise<boolean> {
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
			const err = error as HTTPError;
			this.logger.warn({
				message: "Slack test alert failed",
				service: SERVICE_NAME,
				method: "sendTestAlert",
				stack: err?.stack,
			});
			return false;
		}
	}

	/**
	 * New unified message format - builds Slack Block Kit payload from NotificationMessage
	 */
	async sendMessage(notification: Notification, message: NotificationMessage): Promise<boolean> {
		if (!notification.address) {
			return false;
		}

		const payload = this.buildSlackPayload(message);

		try {
			await got.post(notification.address, {
				json: payload,
				headers: {
					"Content-Type": "application/json",
				},
			});
			this.logger.info({
				message: "[NEW] Slack notification sent via sendMessage",
				service: SERVICE_NAME,
				method: "sendMessage",
			});
			return true;
		} catch (error) {
			const err = error as Error;
			this.logger.warn({
				message: "[NEW] Slack alert failed via sendMessage",
				service: SERVICE_NAME,
				method: "sendMessage",
				stack: err?.stack,
			});
			return false;
		}
	}

	/**
	 * Build Slack Block Kit payload from NotificationMessage
	 * Uses Slack's rich formatting with sections, fields, and context blocks
	 */
	private buildSlackPayload(message: NotificationMessage): object {
		const blocks: any[] = [];

		// Determine color based on severity
		const colorMap = {
			critical: "#FF0000", // Red
			warning: "#FFA500", // Orange
			success: "#00FF00", // Green
			info: "#0000FF", // Blue
		};
		const color = colorMap[message.severity] || "#808080";

		// Header block with title
		blocks.push({
			type: "header",
			text: {
				type: "plain_text",
				text: message.content.title,
				emoji: true,
			},
		});

		// Summary section
		blocks.push({
			type: "section",
			text: {
				type: "mrkdwn",
				text: message.content.summary,
			},
		});

		// Monitor details as fields
		const monitorFields = [
			{ type: "mrkdwn", text: `*Name:*\n${message.monitor.name}` },
			{ type: "mrkdwn", text: `*Type:*\n${message.monitor.type}` },
			{ type: "mrkdwn", text: `*Status:*\n${message.monitor.status}` },
			{ type: "mrkdwn", text: `*URL:*\n${message.monitor.url}` },
		];

		blocks.push({
			type: "section",
			fields: monitorFields,
		});

		// Divider
		blocks.push({ type: "divider" });

		// Threshold breaches (if any)
		if (message.content.thresholds && message.content.thresholds.length > 0) {
			const thresholdText = message.content.thresholds
				.map((breach) => `• *${breach.metric.toUpperCase()}:* ${breach.formattedValue} (threshold: ${breach.threshold}${breach.unit})`)
				.join("\n");

			blocks.push({
				type: "section",
				text: {
					type: "mrkdwn",
					text: `*Threshold Breaches:*\n${thresholdText}`,
				},
			});

			blocks.push({ type: "divider" });
		}

		// Additional details (if any)
		if (message.content.details && message.content.details.length > 0) {
			const detailsText = message.content.details.map((detail) => `• ${detail}`).join("\n");

			blocks.push({
				type: "section",
				text: {
					type: "mrkdwn",
					text: `*Additional Information:*\n${detailsText}`,
				},
			});
		}

		// Incident link button (if incident exists)
		if (message.content.incident) {
			blocks.push({
				type: "actions",
				elements: [
					{
						type: "button",
						text: {
							type: "plain_text",
							text: "View Incident",
							emoji: true,
						},
						url: `${message.clientHost}/infrastructure/${message.monitor.id}`,
						style: "primary",
					},
				],
			});
		}

		// Context footer with timestamp
		blocks.push({
			type: "context",
			elements: [
				{
					type: "mrkdwn",
					text: `Checkmate | ${new Date(message.content.timestamp).toUTCString()}`,
				},
			],
		});

		// Return Slack payload with blocks and attachment color
		return {
			blocks,
			attachments: [
				{
					color,
					blocks: [], // Empty blocks in attachment for color bar
				},
			],
		};
	}
}
