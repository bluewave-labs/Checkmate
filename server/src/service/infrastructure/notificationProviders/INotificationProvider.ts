import type { Monitor, Notification, Alert, MonitorStatusResponse } from "@/types/index.js";
import type { MonitorActionDecision } from "@/service/infrastructure/SuperSimpleQueue/SuperSimpleQueueHelper.js";

export interface INotificationProvider {
	sendAlert: (
		notification: Notification,
		monitor: Monitor,
		monitorStatusResponse: MonitorStatusResponse,
		decision: MonitorActionDecision
	) => Promise<boolean>;
	sendTestAlert(notification: Notification): Promise<boolean>;
}
