import type { Monitor, Notification, MonitorStatusResponse } from "@/types/index.js";
import { INotificationProvider } from "@/service/index.js";
import {
	buildHardwareAlerts,
	buildHardwareWebhookBody,
	buildWebhookBody,
	getTestMessage,
} from "@/service/infrastructure/notificationProviders/utils.js";
import got from "got";

export class SlackProvider implements INotificationProvider {
	constructor(private logger: any) {}
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

		if (!notification.address) {
			return false;
		}

		try {
			this.logger?.debug?.("Sending Slack alert", { address: notification.address });
			await got.post(notification.address, {
				json: { text: body },
				headers: {
					"Content-Type": "application/json",
				},
				responseType: "json",
			});
			return true;
		} catch (error) {
			this.logger?.error?.("Slack alert failed", { error });
			return false;
		}
	}

	async sendTestAlert(notification: Notification): Promise<boolean> {
		if (!notification.address) {
			return false;
		}

		try {
			this.logger?.debug?.("Sending Slack test alert", { address: notification.address });
			await got.post(notification.address, {
				json: { text: getTestMessage() },
				headers: {
					"Content-Type": "application/json",
				},
				responseType: "json",
			});
			return true;
		} catch (error) {
			this.logger?.error?.("Slack test alert failed", { error });
			return false;
		}
	}
}
