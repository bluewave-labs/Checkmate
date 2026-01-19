import type { Monitor, Notification, Alert, MonitorStatusResponse } from "@/types/index.js";

export interface INotificationProvider {
	sendAlert: (notification: Notification, monitor: Monitor, monitorStatusResponse: MonitorStatusResponse) => Promise<boolean>;
	sendTestAlert(notification: Notification): Promise<boolean>;
}
