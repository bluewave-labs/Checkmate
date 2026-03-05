const SERVICE_NAME = "TeamsProvider";
import type { Notification } from "@/types/index.js";
import { INotificationProvider } from "@/service/index.js";
import type { NotificationMessage } from "@/types/notificationMessage.js";
import { getTestMessage } from "@/service/infrastructure/notificationProviders/utils.js";
import got, { HTTPError } from "got";

export class TeamsProvider implements INotificationProvider {
	private logger: any;

	constructor(logger: any) {
		this.logger = logger;
	}

	async sendTestAlert(notification: Notification): Promise<boolean> {
		if (!notification.address) {
			return false;
		}

		try {
			const payload = this.wrapAdaptiveCard({
				type: "AdaptiveCard",
				$schema: "http://adaptivecards.io/schemas/adaptive-card.json",
				version: "1.4",
				body: [
					{
						type: "TextBlock",
						text: getTestMessage(),
						weight: "Bolder",
						size: "Medium",
					},
				],
			});

			await got.post(notification.address, {
				json: payload,
				headers: {
					"Content-Type": "application/json",
				},
			});
			return true;
		} catch (error) {
			const err = error as HTTPError;
			this.logger.warn({
				message: "Teams test alert failed",
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

		const payload = this.wrapAdaptiveCard(this.buildAdaptiveCard(message));

		try {
			await got.post(notification.address, {
				json: payload,
				headers: {
					"Content-Type": "application/json",
				},
			});
			this.logger.info({
				message: "Teams notification sent via sendMessage",
				service: SERVICE_NAME,
				method: "sendMessage",
			});
			return true;
		} catch (error) {
			const err = error as Error;
			this.logger.warn({
				message: "Teams alert failed via sendMessage",
				service: SERVICE_NAME,
				method: "sendMessage",
				stack: err?.stack,
			});
			return false;
		}
	}

	/**
	 * Wrap an Adaptive Card in the Teams webhook envelope format
	 */
	private wrapAdaptiveCard(card: object): object {
		return {
			type: "message",
			attachments: [
				{
					contentType: "application/vnd.microsoft.card.adaptive",
					contentUrl: null,
					content: card,
				},
			],
		};
	}

	/**
	 * Build an Adaptive Card from NotificationMessage
	 */
	private buildAdaptiveCard(message: NotificationMessage): object {
		const colorMap: Record<string, string> = {
			critical: "attention",
			warning: "warning",
			success: "good",
			info: "accent",
		};
		const color = colorMap[message.severity] || "default";

		const body: any[] = [];

		// Header with colored status indicator
		body.push({
			type: "TextBlock",
			text: message.content.title,
			weight: "Bolder",
			size: "Large",
			color,
			wrap: true,
		});

		// Summary
		body.push({
			type: "TextBlock",
			text: message.content.summary,
			wrap: true,
			spacing: "Small",
		});

		// Separator
		body.push({
			type: "ColumnSet",
			separator: true,
			spacing: "Medium",
			columns: [],
		});

		// Monitor details as a FactSet
		body.push({
			type: "FactSet",
			facts: [
				{ title: "Name", value: message.monitor.name },
				{ title: "Type", value: message.monitor.type },
				{ title: "Status", value: message.monitor.status },
				{ title: "URL", value: message.monitor.url },
			],
		});

		// Threshold breaches
		if (message.content.thresholds && message.content.thresholds.length > 0) {
			body.push({
				type: "TextBlock",
				text: "**Threshold Breaches**",
				weight: "Bolder",
				spacing: "Medium",
				wrap: true,
			});

			for (const breach of message.content.thresholds) {
				body.push({
					type: "TextBlock",
					text: `• **${breach.metric.toUpperCase()}**: ${breach.formattedValue} (threshold: ${breach.threshold}${breach.unit})`,
					wrap: true,
					spacing: "Small",
				});
			}
		}

		// Additional details
		if (message.content.details && message.content.details.length > 0) {
			body.push({
				type: "TextBlock",
				text: "**Additional Information**",
				weight: "Bolder",
				spacing: "Medium",
				wrap: true,
			});

			for (const detail of message.content.details) {
				body.push({
					type: "TextBlock",
					text: `• ${detail}`,
					wrap: true,
					spacing: "Small",
				});
			}
		}

		// Timestamp footer
		body.push({
			type: "TextBlock",
			text: `Checkmate | ${new Date(message.content.timestamp).toUTCString()}`,
			size: "Small",
			isSubtle: true,
			spacing: "Medium",
			wrap: true,
		});

		// Actions (incident link)
		const actions: any[] = [];
		if (message.content.incident) {
			actions.push({
				type: "Action.OpenUrl",
				title: "View Incident",
				url: `${message.clientHost}/infrastructure/${message.monitor.id}`,
			});
		}

		return {
			type: "AdaptiveCard",
			$schema: "http://adaptivecards.io/schemas/adaptive-card.json",
			version: "1.4",
			body,
			...(actions.length > 0 ? { actions } : {}),
		};
	}
}
