import { INotificationsService } from "@/domain/notifications/notification.service.js";
import { IMonitorReactor } from "@/worker/reactors/reactor.interface.js";
import { MonitorEvaluation } from "@/worker/worker.interface.js";
export class NotificationReactor implements IMonitorReactor {
	readonly name = "notification";
	readonly blocking = false;
	constructor(private notificationService: INotificationsService) {}

	react = async (evaluation: MonitorEvaluation) => {
		if (!evaluation.decision.shouldSendNotification) return;
		await this.notificationService.handleNotifications(evaluation.monitor, evaluation.status, evaluation.decision);
	};
}
