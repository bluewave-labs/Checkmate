import type { Monitor, Notification, MonitorStatusResponse } from "@/types/index.js";
import { INotificationProvider } from "@/service/index.js";
import { buildHardwareAlerts, buildDiscordBody } from "@/service/infrastructure/notificationProviders/utils.js";
import got from "got";

export class DiscordProvider implements INotificationProvider {
	private getHardwareContent = (monitor: Monitor, monitorStatusResponse: MonitorStatusResponse) => {
		const { discordPayload } = buildHardwareAlerts("HOST_PLACEHOLDER", monitor, monitorStatusResponse);
		return discordPayload;
	};

	sendAlert = async (notification: Notification, monitor: Monitor, monitorStatusResponse: MonitorStatusResponse) => {
		let body;
		if (monitor.type === "hardware") {
			body = this.getHardwareContent(monitor, monitorStatusResponse);
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
				responseType: "json",
			});
			return true;
		} catch (error: any) {
			return false;
		}
	};
	sendTestAlert = async (notification: Notification) => {
		return false;
	};
}
