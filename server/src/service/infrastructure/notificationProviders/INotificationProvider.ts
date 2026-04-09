import type { Notification, Monitor } from "@/types/index.js";
import type { NotificationMessage } from "@/types/notificationMessage.js";

export interface INotificationProvider {
	sendMessage: (notification: Notification, message: NotificationMessage) => Promise<boolean>;
	sendEscalationMessage?: (notification: Notification, monitor: Monitor, message: NotificationMessage) => Promise<boolean>;
	sendTestAlert(notification: Partial<Notification>): Promise<boolean>;
}
