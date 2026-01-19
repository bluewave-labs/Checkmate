import type { Monitor, Alert, Notification, MonitorStatusResponse } from "@/types/index.js";
import { INotificationProvider } from "@/service/index.js";
import { buildHardwareAlerts, buildHardwareWebhookBody, buildWebhookBody } from "@/service/infrastructure/notificationProviders/utils.js";
import got from "got";

export class WebhookProvider implements INotificationProvider {
	private getHardwareContent = (monitor: Monitor, monitorStatusResponse: MonitorStatusResponse) => {
		const { alertsToSend } = buildHardwareAlerts("HOST_PLACEHOLDER", monitor, monitorStatusResponse);
		const body = buildHardwareWebhookBody(alertsToSend, monitor);
		return body;
	};

	private getContent = (monitor: Monitor, monitorStatusResponse: MonitorStatusResponse) => {
		const body = buildWebhookBody(monitor, monitorStatusResponse);
		return body;
	};

	sendAlert = async (notification: Notification, monitor: Monitor, monitorStatusResponse: MonitorStatusResponse) => {
		let body;
		if (monitor.type === "hardware") {
			body = this.getHardwareContent(monitor, monitorStatusResponse);
		} else {
			body = this.getContent(monitor, monitorStatusResponse);
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
				responseType: "json",
			});
			return true;
		} catch (error) {
			return false;
		}
	};

	sendTestAlert = async (notification: Notification) => {
		return false;
	};
}
