import type { Monitor, Notification, MonitorStatusResponse } from "@/types/index.js";
import { INotificationProvider } from "@/service/index.js";
export class DiscordProvider implements INotificationProvider {
	sendAlert = async (notification: Notification, monitor: Monitor, monitorStatusResponse: MonitorStatusResponse) => {
		return false;
	};
	sendTestAlert = async (notification: Notification) => {
		return false;
	};
}
