const SERVICE_NAME = "WebhookProvider";
import type { Monitor, Alert, Notification, MonitorStatusResponse } from "@/types/index.js";
import { INotificationProvider } from "@/service/index.js";
import type { MonitorActionDecision } from "@/service/infrastructure/SuperSimpleQueue/SuperSimpleQueueHelper.js";
import {
	buildHardwareAlerts,
	buildHardwareNotificationMessage,
	buildWebhookBody,
	getTestMessage,
} from "@/service/infrastructure/notificationProviders/utils.js";
import got from "got";

export class WebhookProvider implements INotificationProvider {
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
		const { alertsToSend } = buildHardwareAlerts("HOST_PLACEHOLDER", monitor, monitorStatusResponse);
		const body = buildHardwareNotificationMessage(clientHost, alertsToSend, monitor);
		return body;
	};

	private getContent = (monitor: Monitor, monitorStatusResponse: MonitorStatusResponse): string => {
		const body = buildWebhookBody(monitor, monitorStatusResponse);
		return body;
	};

	sendAlert = async (notification: Notification, monitor: Monitor, monitorStatusResponse: MonitorStatusResponse, decision: MonitorActionDecision) => {
		let body;
		if (monitor.type === "hardware") {
			body = this.getHardwareContent("HOST_PLACEHOLDER", monitor, monitorStatusResponse, decision);
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
				message: "Webhook alert failed",
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
				json: { text: getTestMessage() },
				headers: {
					"Content-Type": "application/json",
				},
			});
			return true;
		} catch (error) {
			const err = error as Error;
			this.logger.warn({
				message: "Webhook test alert failed",
				service: SERVICE_NAME,
				method: "sendTestAlert",
				stack: err?.stack,
			});
			return false;
		}
	};
}
