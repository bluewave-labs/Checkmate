import type { HardwareStatusPayload, Monitor, MonitorStatusResponse, Notification } from "@/types/index.js";
import { shouldSendHardwareAlert } from "@/service/infrastructure/notificationProviders/utils.js";
import { INotificationsRepository } from "@/repositories/index.js";
import { INotificationProvider } from "./notificationProviders/INotificationProvider.js";
export interface INotificationsService {
	handleNotifications: (
		monitor: Monitor,
		monitorStatusResponse: MonitorStatusResponse,
		prevStatus: boolean | undefined,
		statusChanged: boolean
	) => Promise<boolean>;
	sendTestNotification: (notification: Notification) => Promise<boolean>;
	testAllNotifications: (notificationIds: string[]) => Promise<boolean>;
}

const SERVICE_NAME = "NotificationsService";

export class NotificationsService implements INotificationsService {
	static SERVICE_NAME = SERVICE_NAME;

	private notificationsRepository: INotificationsRepository;
	private webhookProvider: INotificationProvider;
	private emailProvider: INotificationProvider;
	private slackProvider: INotificationProvider;
	private discordProvider: INotificationProvider;
	private pagerDutyProvider: INotificationProvider;
	private matrixProvider: INotificationProvider;
	private logger: any;

	constructor(
		notificationsRepository: INotificationsRepository,
		webhookProvider: INotificationProvider,
		emailProvider: INotificationProvider,
		slackProvider: INotificationProvider,
		discordProvider: INotificationProvider,
		pagerDutyProvider: INotificationProvider,
		matrixProvider: INotificationProvider,
		logger: any
	) {
		this.notificationsRepository = notificationsRepository;
		this.webhookProvider = webhookProvider;
		this.emailProvider = emailProvider;
		this.slackProvider = slackProvider;
		this.discordProvider = discordProvider;
		this.pagerDutyProvider = pagerDutyProvider;
		this.matrixProvider = matrixProvider;
		this.logger = logger;
	}

	private send = async (notification: Notification, monitor: Monitor, monitorStatusResponse: MonitorStatusResponse): Promise<boolean> => {
		switch (notification.type) {
			case "email":
				return await this.emailProvider.sendAlert(notification, monitor, monitorStatusResponse);
			case "slack":
				return await this.slackProvider.sendAlert(notification, monitor, monitorStatusResponse);
			case "discord":
				return await this.discordProvider.sendAlert(notification, monitor, monitorStatusResponse);
			case "pager_duty":
				return await this.pagerDutyProvider.sendAlert(notification, monitor, monitorStatusResponse);
			case "matrix":
				return await this.matrixProvider.sendAlert(notification, monitor, monitorStatusResponse);
			case "webhook":
				return await this.webhookProvider.sendAlert(notification, monitor, monitorStatusResponse);
			default:
				return false;
		}
	};

	private sendNotifications = async (monitor: Monitor, monitorStatusResponse: MonitorStatusResponse) => {
		const notificationIds = monitor.notifications ?? [];
		const notifications = await this.notificationsRepository.findNotificationsByIds(notificationIds);
		const tasks = notifications.map((notification) => this.send(notification, monitor, monitorStatusResponse));
		const outcomes = await Promise.all(tasks);
		const succeeded = outcomes.filter(Boolean).length;
		const failed = outcomes.length - succeeded;
		if (failed > 0) {
			this.logger.warn({
				message: `Notification send completed with ${succeeded} success, ${failed} failure(s)`,
				service: SERVICE_NAME,
				method: "getMonitorJob",
			});
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

			return await this.sendNotifications(monitor, monitorStatusResponse);
		}

		// We should send a notification for non-hardware monitor status change
		return await this.sendNotifications(monitor, monitorStatusResponse);
	};

	sendTestNotification = async (notification: Notification) => {
		switch (notification.type) {
			case "email":
				return await this.emailProvider.sendTestAlert(notification);
			case "slack":
				return await this.slackProvider.sendTestAlert(notification);
			case "discord":
				return await this.discordProvider.sendTestAlert(notification);
			case "pager_duty":
				return await this.pagerDutyProvider.sendTestAlert(notification);
			case "matrix":
				return await this.matrixProvider.sendTestAlert(notification);
			case "webhook":
				return await this.webhookProvider.sendTestAlert(notification);
			default:
				return false;
		}
	};

	testAllNotifications = async (notificationIds: string[]) => {
		const notifications = await this.notificationsRepository.findNotificationsByIds(notificationIds);
		const tasks = notifications.map((notification) => this.sendTestNotification(notification));
		const outcomes = await Promise.all(tasks);
		const succeeded = outcomes.filter(Boolean).length;
		const failed = outcomes.length - succeeded;
		if (failed > 0) {
			return false;
		}
		return true;
	};
}
