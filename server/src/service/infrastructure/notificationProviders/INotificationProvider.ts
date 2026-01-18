import type { Monitor, Notification, Alert, MonitorStatusResponse } from "@/types/index.js";

export interface INotificationProvider {
	buildAlert: (monitor: Monitor, monitorStatusResponse: MonitorStatusResponse) => Alert;
	sendAlert: (alert: Alert, notification: Notification) => Promise<boolean>;
	sendTestAlert(notification: Notification): Promise<boolean>;
}
