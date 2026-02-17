const SERVICE_NAME = "DiscordProvider";
import type { Monitor, Notification, MonitorStatusResponse } from "@/types/index.js";
import { INotificationProvider } from "@/service/index.js";
import type { MonitorActionDecision } from "@/service/infrastructure/SuperSimpleQueue/SuperSimpleQueueHelper.js";
import { buildHardwareAlerts, buildDiscordBody, getTestMessage } from "@/service/infrastructure/notificationProviders/utils.js";
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
}
