import type { HardwareStatusPayload, Monitor, MonitorStatusResponse, Notification } from "@/types/index.js";
import { shouldSendHardwareAlert } from "@/service/infrastructure/notificationProviders/utils.js";
import { INotificationsRepository } from "@/repositories/index.js";
import { WebhookProvider } from "@/service/index.js";
export interface INotificationsService {
	handleNotifications: (
		monitor: Monitor,
		monitorStatusResponse: MonitorStatusResponse,
		prevStatus: boolean | undefined,
		statusChanged: boolean
	) => Promise<boolean>;
}

export class NotificationsService implements INotificationsService {
	private notificationsRepository: INotificationsRepository;
	private webhookProvider: WebhookProvider;

	constructor(notificationsRepository: INotificationsRepository, webhookProvider: WebhookProvider) {
		this.notificationsRepository = notificationsRepository;
		this.webhookProvider = webhookProvider;
	}

	private send = async (notification: Notification, monitor: Monitor, monitorStatusResponse: MonitorStatusResponse): Promise<boolean> => {
		switch (notification.type) {
			case " email": {
			}
			case "webhook": {
				return await this.webhookProvider.sendAlert(notification, monitor, monitorStatusResponse);
			}
		}
		return false;
	};

	private sendNotifications = async (monitor: Monitor, monitorStatusResponse: MonitorStatusResponse) => {
		const notificationIds = monitor.notifications ?? [];
		const notifications = await this.notificationsRepository.findNotificationsByIds(notificationIds);
		const tasks = notifications.map((notification) => this.send(notification, monitor, monitorStatusResponse));
		const outcomes = await Promise.all(tasks);
		const succeeded = outcomes.filter(Boolean).length;
		const failed = outcomes.length - succeeded;
		if (failed > 0) {
			// logger.warn(`Notification send completed with ${succeeded} success, ${failed} failure(s)`);
		}
		// Return true if all notificaitons succeeded
		return succeeded === notifications.length;
	};

	handleNotifications = async (
		monitor: Monitor,
		monitorStatusResponse: MonitorStatusResponse,
		prevStatus: boolean | undefined,
		statusChanged: boolean
	) => {
		const { type } = monitor;
		const payload = monitorStatusResponse.payload as HardwareStatusPayload;
		// If this is a non-hardeware type monitor and status did not change, we're done
		if (type !== "hardware" && statusChanged === false) return false;
		// if prevStatus is undefined, monitor is resuming, we're done
		if (type !== "hardware" && prevStatus === undefined) return false;

		// Deal with hardware thresholds
		if (type === "hardware") {
			const thresholds = monitor.thresholds;

			if (thresholds === undefined) return false; // No thresholds set, we're done
			const metrics = payload?.data ?? null;
			if (metrics === null) return false; // No metrics, we're done

			// We should send a notificaiton

			const shouldSend = shouldSendHardwareAlert(monitor, monitorStatusResponse);
			if (shouldSend === false) return false;
			console.log(JSON.stringify(monitor, null, 2));
			// const { subject, html } = await this.notificationUtils.buildHardwareEmail(networkResponse, alerts);
			// const content = await this.notificationUtils.buildHardwareNotificationMessage(alerts, monitor);
			// const webhookBody = await this.notificationUtils.buildHardwareWebhookBody(alerts, monitor);
			// const success = await this.notifyAll({ notificationIDs, subject, html, content, discordContent, webhookBody });
			return await this.sendNotifications(monitor, monitorStatusResponse);
		}

		// We should send a notification for non-hardware monitor status change
		return await this.sendNotifications(monitor, monitorStatusResponse);
	};
}
