import got from "got";
import type { Monitor, Notification, MonitorStatusResponse } from "@/types/index.js";
import { INotificationProvider } from "@/service/index.js";
import { buildHardwareAlerts, buildHardwareWebhookBody, buildWebhookBody } from "@/service/infrastructure/notificationProviders/utils.js";

export class PagerDutyProvider implements INotificationProvider {
	private getHardwareContent = (monitor: Monitor, monitorStatusResponse: MonitorStatusResponse) => {
		const { alertsToSend } = buildHardwareAlerts("HOST_PLACEHOLDER", monitor, monitorStatusResponse);
		const body = buildHardwareWebhookBody(alertsToSend, monitor);
		return body;
	};

	private getContent = (monitor: Monitor, monitorStatusResponse: MonitorStatusResponse) => {
		const body = buildWebhookBody(monitor, monitorStatusResponse);
		return body;
	};

	async sendAlert(notification: Notification, monitor: Monitor, monitorStatusResponse: MonitorStatusResponse): Promise<boolean> {
		let body;
		if (monitor.type === "hardware") {
			body = this.getHardwareContent(monitor, monitorStatusResponse);
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
				responseType: "json",
			});

			return true;
		} catch (error) {
			return false;
		}
	}

	async sendTestAlert(notification: Notification): Promise<boolean> {
		return false;
	}
}
