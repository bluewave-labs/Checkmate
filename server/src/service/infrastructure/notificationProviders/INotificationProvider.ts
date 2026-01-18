import type { Monitor, Notification, Alert } from "@/types/index.js";

export interface IMessageProvider {
	buildAlert: (monitor: Monitor) => Alert;
	sendAlert: (alert: Alert, notification: Notification) => Promise<boolean>;
	sendTestAlert(notification: Notification): Promise<boolean>;
}
