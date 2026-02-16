import type { Monitor, Notification, Alert, MonitorStatusResponse } from "@/types/index.js";
import type { MonitorActionDecision } from "@/service/infrastructure/SuperSimpleQueue/SuperSimpleQueueHelper.js";
import type { NotificationMessage } from "@/types/notificationMessage.js";

export interface INotificationProvider {
	sendAlert: (
		notification: Notification,
		monitor: Monitor,
		monitorStatusResponse: MonitorStatusResponse,
		decision: MonitorActionDecision,
		clientHost: string
	) => Promise<boolean>;
	sendMessage?: (notification: Notification, message: NotificationMessage) => Promise<boolean>;
	sendTestAlert(notification: Notification): Promise<boolean>;
}
