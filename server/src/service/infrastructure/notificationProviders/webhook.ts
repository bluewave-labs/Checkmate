import type { Monitor, Alert, Notification, MonitorStatusResponse } from "@/types/index.js";
import { INotificationProvider } from "@/service/index.js";
export class WebhookProvider implements INotificationProvider {
	buildAlert = (monitor: Monitor, monitorStatusResponse: MonitorStatusResponse) => {
		return null;
	};

	sendAlert = async (alert: Alert) => {
		return false;
	};

	sendTestAlert(notification: Notification): Promise<boolean> {
		return false;
	}
}
