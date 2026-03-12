import type { Notification } from "@/types/index.js";
import type { NotificationMessage } from "@/types/notificationMessage.js";

export interface INotificationProvider {
	sendMessage: (notification: Notification, message: NotificationMessage) => Promise<boolean>;
	sendTestAlert(notification: Partial<Notification>): Promise<boolean>;
}
