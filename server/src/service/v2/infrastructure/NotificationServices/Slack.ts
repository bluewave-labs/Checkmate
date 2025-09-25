import { IMonitor, INotificationChannel } from "../../../../db/v2/models/index.js";
import { IAlert, IMessageService } from "./IMessageService.js";
import got from "got";

const SERVICE_NAME = "SlackServiceV2";
class SlackService implements IMessageService {
	static SERVICE_NAME = SERVICE_NAME;
	constructor() {}

	private toSlackBlocks = (alert: IAlert) => {
		return [
			{
				type: "header",
				text: {
					type: "plain_text",
					text: "Status Alert",
				},
			},
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: `*Monitor name:* ${alert.name}`,
				},
			},

			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: `*Status:* ${alert.status}`,
				},
			},

			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: `*URL:* ${alert.url}`,
				},
			},
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: `*Checked at:* ${alert?.checkTime?.toISOString() || "N/A"}`,
				},
			},

			{
				type: "divider",
			},

			...(alert.details
				? Object.entries(alert.details).map(([key, value]) => ({
						type: "section",
						fields: [
							{
								type: "mrkdwn",
								text: `*${key}:* ${value}`,
							},
						],
					}))
				: []),

			{
				type: "context",
				elements: [
					{
						type: "mrkdwn",
						text: `*Alert generated at:* ${alert?.alertTime?.toISOString() || "N/A"}`,
					},
				],
			},
		];
	};

	buildAlert = (monitor: IMonitor) => {
		const name = monitor?.name || "Unnamed monitor";
		const monitorStatus = monitor?.status || "unknown status";
		const url = monitor?.url || "no URL";
		const checkTime = monitor?.lastCheckedAt || null;
		const alertTime = new Date();
		return {
			name,
			url,
			status: monitorStatus,
			checkTime,
			alertTime,
		};
	};

	sendMessage = async (alert: IAlert, channel: INotificationChannel) => {
		const notificationUrl = channel?.config?.url;
		if (!notificationUrl) {
			throw new Error("Webhook URL not configured");
		}

		try {
			const payload = {
				text: "Status Alert",
				blocks: this.toSlackBlocks(alert),
			};
			await got.post(notificationUrl, { json: payload });
		} catch (error) {
			console.warn("Error sending Slack message:", error);
			return false;
		}

		return true;
	};

	testMessage = async () => {
		return true;
	};
}

export default SlackService;
