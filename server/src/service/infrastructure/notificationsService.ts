import type { HardwareStatusPayload, Monitor, MonitorStatusResponse, Notification } from "@/types/index.js";
import { NotificationModel } from "@/db/models/index.js";
import { buildHardwareAlerts, shouldSendHardwareAlert } from "@/service/infrastructure/notificationProviders/utils.js";
import { INotificationsRepository } from "@/repositories/index.js";
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
	constructor(notificationsRepository: INotificationsRepository) {
		this.notificationsRepository = notificationsRepository;
	}

	private send = (notification: Notification, monitor: Monitor, monitorStatusResponse: MonitorStatusResponse) => {
		console.log(notification);
	};

	private sendNotifications = async (monitor: Monitor, monitorStatusResponse: MonitorStatusResponse) => {
		const notifications = await this.notificationsRepository.findByMonitorId(monitor.id);
		console.log({ notifications });
		const tasks = notifications.map((notification) => {
			this.send(notification, monitor, monitorStatusResponse);
		});
		return true;
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

			// We shoul dsend a notificaiton

			const shouldSend = shouldSendHardwareAlert(monitor, monitorStatusResponse);
			if (shouldSend === false) return false;
			console.log(JSON.stringify(monitor, null, 2));
			console.log(JSON.stringify(monitorStatusResponse, null, 2));
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
