import type { Monitor, Notification, MonitorStatusResponse } from "@/types/index.js";
import { INotificationProvider } from "@/service/index.js";

export class EmailProvider implements INotificationProvider {
	async sendAlert(notification: Notification, monitor: Monitor, monitorStatusResponse: MonitorStatusResponse): Promise<boolean> {
		return false;
	}

	async sendTestAlert(notification: Notification): Promise<boolean> {
		return false;
	}
}
