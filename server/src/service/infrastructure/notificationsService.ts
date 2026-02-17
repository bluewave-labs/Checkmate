import type { HardwareStatusPayload, Monitor, MonitorStatusResponse, Notification, MonitorStatus } from "@/types/index.js";
import { IMonitorsRepository, INotificationsRepository } from "@/repositories/index.js";
import { INotificationProvider } from "./notificationProviders/INotificationProvider.js";
import type { MonitorActionDecision } from "@/service/infrastructure/SuperSimpleQueue/SuperSimpleQueueHelper.js";
import type { ISettingsService } from "@/service/system/settingsService.js";
import { ILogger } from "@/utils/logger.js";
import type { INotificationMessageBuilder } from "@/service/infrastructure/notificationMessageBuilder.js";

export interface INotificationsService {
	createNotification: (notificationData: Partial<Notification>) => Promise<Notification>;
	findById: (id: string, teamId: string) => Promise<Notification>;
	findNotificationsByTeamId: (teamId: string) => Promise<Notification[]>;
	updateById(id: string, teamId: string, updateData: Partial<Notification>): Promise<Notification>;
	deleteById: (id: string, teamId: string) => Promise<Notification>;
	handleNotifications: (monitor: Monitor, monitorStatusResponse: MonitorStatusResponse, decision: MonitorActionDecision) => Promise<boolean>;

	sendTestNotification: (notification: Notification) => Promise<boolean>;
	testAllNotifications: (notificationIds: string[]) => Promise<boolean>;
}

const SERVICE_NAME = "NotificationsService";

export class NotificationsService implements INotificationsService {
	static SERVICE_NAME = SERVICE_NAME;

	private notificationsRepository: INotificationsRepository;
	private monitorsRepository: IMonitorsRepository;
	private webhookProvider: INotificationProvider;
	private emailProvider: INotificationProvider;
	private slackProvider: INotificationProvider;
	private discordProvider: INotificationProvider;
	private pagerDutyProvider: INotificationProvider;
	private matrixProvider: INotificationProvider;
	private logger: ILogger;
	private settingsService: ISettingsService;
	private notificationMessageBuilder: INotificationMessageBuilder;

	constructor(
		notificationsRepository: INotificationsRepository,
		monitorsRepository: IMonitorsRepository,
		webhookProvider: INotificationProvider,
		emailProvider: INotificationProvider,
		slackProvider: INotificationProvider,
		discordProvider: INotificationProvider,
		pagerDutyProvider: INotificationProvider,
		matrixProvider: INotificationProvider,
		settingsService: ISettingsService,
		logger: ILogger,
		notificationMessageBuilder: INotificationMessageBuilder
	) {
		this.notificationsRepository = notificationsRepository;
		this.monitorsRepository = monitorsRepository;
		this.webhookProvider = webhookProvider;
		this.emailProvider = emailProvider;
		this.slackProvider = slackProvider;
		this.discordProvider = discordProvider;
		this.pagerDutyProvider = pagerDutyProvider;
		this.matrixProvider = matrixProvider;
		this.settingsService = settingsService;
		this.logger = logger;
		this.notificationMessageBuilder = notificationMessageBuilder;
	}

	private send = async (
		notification: Notification,
		monitor: Monitor,
		monitorStatusResponse: MonitorStatusResponse,
		decision: MonitorActionDecision,
		notificationMessage?: any
	): Promise<boolean> => {
		const settings = this.settingsService.getSettings();
		const clientHost = settings.clientHost || "Host not defined";

		// Route to new sendMessage method if provider supports it
		if (notification.type === "webhook" && this.webhookProvider.sendMessage && notificationMessage) {
			this.logger.info({
				message: "[NEW] Using sendMessage for webhook",
				service: SERVICE_NAME,
				method: "send",
			});
			return await this.webhookProvider.sendMessage(notification, notificationMessage);
		}

		if (notification.type === "slack" && this.slackProvider.sendMessage && notificationMessage) {
			this.logger.info({
				message: "[NEW] Using sendMessage for slack",
				service: SERVICE_NAME,
				method: "send",
			});
			return await this.slackProvider.sendMessage(notification, notificationMessage);
		}

		if (notification.type === "matrix" && this.matrixProvider.sendMessage && notificationMessage) {
			this.logger.info({
				message: "[NEW] Using sendMessage for matrix",
				service: SERVICE_NAME,
				method: "send",
			});
			return await this.matrixProvider.sendMessage(notification, notificationMessage);
		}

		if (notification.type === "pager_duty" && this.pagerDutyProvider.sendMessage && notificationMessage) {
			this.logger.info({
				message: "[NEW] Using sendMessage for pagerduty",
				service: SERVICE_NAME,
				method: "send",
			});
			return await this.pagerDutyProvider.sendMessage(notification, notificationMessage);
		}

		if (notification.type === "discord" && this.discordProvider.sendMessage && notificationMessage) {
			this.logger.info({
				message: "[NEW] Using sendMessage for discord",
				service: SERVICE_NAME,
				method: "send",
			});
			return await this.discordProvider.sendMessage(notification, notificationMessage);
		}

		if (notification.type === "email" && this.emailProvider.sendMessage && notificationMessage) {
			this.logger.info({
				message: "[NEW] Using sendMessage for email",
				service: SERVICE_NAME,
				method: "send",
			});
			return await this.emailProvider.sendMessage(notification, notificationMessage);
		}

		// Fallback to existing sendAlert for all providers
		switch (notification.type) {
			case "email":
				return await this.emailProvider.sendAlert(notification, monitor, monitorStatusResponse, decision, clientHost);
			case "slack":
				return await this.slackProvider.sendAlert(notification, monitor, monitorStatusResponse, decision, clientHost);
			case "discord":
				return await this.discordProvider.sendAlert(notification, monitor, monitorStatusResponse, decision, clientHost);
			case "pager_duty":
				return await this.pagerDutyProvider.sendAlert(notification, monitor, monitorStatusResponse, decision, clientHost);
			case "matrix":
				return await this.matrixProvider.sendAlert(notification, monitor, monitorStatusResponse, decision, clientHost);
			case "webhook":
				return await this.webhookProvider.sendAlert(notification, monitor, monitorStatusResponse, decision, clientHost);
			default:
				return false;
		}
	};

	private sendNotifications = async (monitor: Monitor, monitorStatusResponse: MonitorStatusResponse, decision: MonitorActionDecision) => {
		const notificationIds = monitor.notifications ?? [];
		const notifications = await this.notificationsRepository.findNotificationsByIds(notificationIds);

		// Build notification message once for all notifications
		const settings = this.settingsService.getSettings();
		const clientHost = settings.clientHost || "Host not defined";
		const notificationMessage = this.notificationMessageBuilder.buildMessage(monitor, monitorStatusResponse, decision, clientHost);

		const tasks = notifications.map((notification) => this.send(notification, monitor, monitorStatusResponse, decision, notificationMessage));

		const outcomes = await Promise.all(tasks);
		const succeeded = outcomes.filter(Boolean).length;
		const failed = outcomes.length - succeeded;
		if (failed > 0) {
			this.logger.warn({
				message: `Notification send completed with ${succeeded} success, ${failed} failure(s)`,
				service: SERVICE_NAME,
				method: "sendNotifications",
			});
		}
		// Return true if all notifications succeeded
		return succeeded === notifications.length;
	};

	handleNotifications = async (monitor: Monitor, monitorStatusResponse: MonitorStatusResponse, decision: MonitorActionDecision) => {
		if (!decision.shouldSendNotification) {
			return false;
		}

		// Send notifications based on decision
		return await this.sendNotifications(monitor, monitorStatusResponse, decision);
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

	createNotification = async (notificationData: Partial<Notification>): Promise<Notification> => {
		return await this.notificationsRepository.create(notificationData);
	};

	findById = async (id: string, teamId: string): Promise<Notification> => {
		return await this.notificationsRepository.findById(id, teamId);
	};

	findNotificationsByTeamId = async (teamId: string): Promise<Notification[]> => {
		return await this.notificationsRepository.findByTeamId(teamId);
	};

	updateById = async (id: string, teamId: string, updateData: Partial<Notification>): Promise<Notification> => {
		return await this.notificationsRepository.updateById(id, teamId, updateData);
	};

	deleteById = async (id: string, teamId: string): Promise<Notification> => {
		const deleted = await this.notificationsRepository.deleteById(id, teamId);
		await this.monitorsRepository.removeNotificationFromMonitors(id);
		return deleted;
	};
}
