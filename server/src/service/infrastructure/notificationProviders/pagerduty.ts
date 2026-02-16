const SERVICE_NAME = "PagerDutyProvider";
import got from "got";
import type { Monitor, Notification, MonitorStatusResponse } from "@/types/index.js";
import type { MonitorActionDecision } from "@/service/infrastructure/SuperSimpleQueue/SuperSimpleQueueHelper.js";
import { INotificationProvider } from "@/service/index.js";
import {
	buildHardwareAlerts,
	buildHardwareNotificationMessage,
	buildWebhookBody,
	getTestMessage,
} from "@/service/infrastructure/notificationProviders/utils.js";

export class PagerDutyProvider implements INotificationProvider {
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

		try {
			await got.post("https://events.pagerduty.com/v2/enqueue", {
				json: {
					routing_key: notification.address,
					event_action: "trigger",
					payload: {
						summary: body,
						severity: "critical",
						source: monitor.url,
						timestamp: new Date().toISOString(),
					},
				},
			});

			return true;
		} catch (error) {
			const err = error as Error;
			this.logger.warn({
				message: "PagerDuty alert failed",
				service: SERVICE_NAME,
				method: "sendAlert",
				stack: err?.stack,
			});
			return false;
		}
	}

	async sendTestAlert(notification: Notification): Promise<boolean> {
		try {
			await got.post("https://events.pagerduty.com/v2/enqueue", {
				json: {
					routing_key: notification.address,
					event_action: "trigger",
					payload: {
						summary: getTestMessage(),
						severity: "info",
						source: "checkmate",
						timestamp: new Date().toISOString(),
					},
				},
				responseType: "json",
			});
			return true;
		} catch (error) {
			const err = error as Error;
			this.logger.warn({
				message: "PagerDuty test alert failed",
				service: SERVICE_NAME,
				method: "sendTestAlert",
				stack: err?.stack,
			});
			return false;
		}
	}
}
