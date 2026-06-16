import type { Monitor } from "@/domain/monitors/monitor.types.js";
import type { Notification } from "@/domain/notifications/notification.type.js";
import type { MonitorStatusResponse } from "@/types/network.js";
import type { NotificationMessage } from "@/domain/notifications/notification.type.js";
import { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";
import { INotificationsRepository } from "@/domain/notifications/notification.repository.interface.js";
import { INotificationProvider } from "@/domain/notifications/providers/INotificationProvider.js";
import type { MonitorActionDecision } from "@/worker/worker.helper.js";
import type { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import { ILogger } from "@/utils/logger.js";
import type { INotificationMessageBuilder } from "@/domain/notifications/notification.message-builder.js";

export interface INotificationsService {
	createNotification: (notificationData: Partial<Notification>, userId: string, teamId: string) => Promise<Notification>;
	findById: (id: string, teamId: string) => Promise<Notification>;
	findNotificationsByTeamId: (teamId: string) => Promise<Notification[]>;
	updateById(id: string, teamId: string, updateData: Partial<Notification>): Promise<Notification>;
	deleteById: (id: string, teamId: string) => Promise<Notification>;
	handleNotifications: (monitor: Monitor, monitorStatusResponse: MonitorStatusResponse, decision: MonitorActionDecision) => Promise<boolean>;

	sendTestNotification: (notification: Partial<Notification>) => Promise<boolean>;
	testAllNotifications: (notificationIds: string[]) => Promise<boolean>;
	handleCertificateExpiryNotification: (monitor: Monitor, expiryDate: Date, daysRemaining: number) => Promise<boolean>;
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
	private teamsProvider: INotificationProvider;
	private telegramProvider: INotificationProvider;
	private pushoverProvider: INotificationProvider;
	private twilioProvider: INotificationProvider;
	private ntfyProvider: INotificationProvider;
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
		teamsProvider: INotificationProvider,
		telegramProvider: INotificationProvider,
		pushoverProvider: INotificationProvider,
		twilioProvider: INotificationProvider,
		ntfyProvider: INotificationProvider,
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
		this.teamsProvider = teamsProvider;
		this.telegramProvider = telegramProvider;
		this.pushoverProvider = pushoverProvider;
		this.twilioProvider = twilioProvider;
		this.ntfyProvider = ntfyProvider;
		this.settingsService = settingsService;
		this.logger = logger;
		this.notificationMessageBuilder = notificationMessageBuilder;
	}

	private send = async (
		notification: Notification,
		monitor: Monitor,
		monitorStatusResponse: MonitorStatusResponse,
		decision: MonitorActionDecision,
		notificationMessage: NotificationMessage | undefined
	): Promise<boolean> => {
		if (!notificationMessage) {
			this.logger.warn({
				message: "Notification message not provided",
				service: SERVICE_NAME,
				method: "send",
			});
			return false;
		}

		// Route to provider based on notification type
		switch (notification.type) {
			case "webhook":
				return await this.webhookProvider.sendMessage!(notification, notificationMessage);
			case "slack":
				return await this.slackProvider.sendMessage!(notification, notificationMessage);
			case "matrix":
				return await this.matrixProvider.sendMessage!(notification, notificationMessage);
			case "pager_duty":
				return await this.pagerDutyProvider.sendMessage!(notification, notificationMessage);
			case "discord":
				return await this.discordProvider.sendMessage!(notification, notificationMessage);
			case "email":
				return await this.emailProvider.sendMessage!(notification, notificationMessage);
			case "teams":
				return await this.teamsProvider.sendMessage!(notification, notificationMessage);
			case "telegram":
				return await this.telegramProvider.sendMessage!(notification, notificationMessage);
			case "pushover":
				return await this.pushoverProvider.sendMessage!(notification, notificationMessage);
			case "twilio":
				return await this.twilioProvider.sendMessage!(notification, notificationMessage);
			case "ntfy":
				return await this.ntfyProvider.sendMessage!(notification, notificationMessage);
			default:
				this.logger.warn({
					message: `Unknown notification type: ${notification.type}`,
					service: SERVICE_NAME,
					method: "send",
				});
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

	handleCertificateExpiryNotification = async (monitor: Monitor, expiryDate: Date, daysRemaining: number): Promise<boolean> => {
		const notificationIds = monitor.notifications ?? [];

		if (notificationIds.length === 0) {
			return false;
		}

		const notifications = await this.notificationsRepository.findNotificationsByIds(notificationIds);

		if (notifications.length === 0) {
			return false;
		}

		const settings = this.settingsService.getSettings();
		const clientHost = settings.clientHost || "Host not defined";

		const monitorName = monitor.name || monitor.url || monitor.id;
		const monitorUrl = monitor.url || "";
		const expiryDateText = expiryDate.toUTCString();

		const title = "TLS certificate expiry warning";
		const message = `TLS certificate for ${monitorName} will expire in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} on ${expiryDateText}.`;

		const notificationMessage: NotificationMessage = {
			type: "ssl_certificate_expiry",
			severity: "warning",
			monitor: {
				id: monitor.id,
				name: monitorName,
				url: monitorUrl,
				type: monitor.type,
				status: monitor.status,
			},
			content: {
				title,
				summary: message,
				details: [`Certificate expiry date: ${expiryDateText}`, `Days remaining: ${daysRemaining}`],
				timestamp: new Date(),
			},
			clientHost,
			metadata: {
				teamId: monitor.teamId,
				notificationReason: "certificate_expiry",
			},
		};

		const monitorStatusResponse = {
			status: "warning",
			code: 200,
			message,
			responseTime: 0,
		} as unknown as MonitorStatusResponse;

		const decision = {
			shouldCreateIncident: false,
			shouldResolveIncident: false,
			shouldSendNotification: true,
			incidentReason: null,
			notificationReason: "status_change",
		} as MonitorActionDecision;

		const tasks = notifications.map((notification) => this.send(notification, monitor, monitorStatusResponse, decision, notificationMessage));
		const outcomes = await Promise.all(tasks);

		const succeeded = outcomes.filter(Boolean).length;

		return succeeded > 0;
	};

	sendTestNotification = async (notification: Partial<Notification>) => {
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
			case "teams":
				return await this.teamsProvider.sendTestAlert(notification);
			case "telegram":
				return await this.telegramProvider.sendTestAlert(notification);
			case "pushover":
				return await this.pushoverProvider.sendTestAlert(notification);
			case "twilio":
				return await this.twilioProvider.sendTestAlert(notification);
			case "ntfy":
				return await this.ntfyProvider.sendTestAlert(notification);
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

	createNotification = async (notificationData: Partial<Notification>, userId: string, teamId: string): Promise<Notification> => {
		notificationData.userId = userId;
		notificationData.teamId = teamId;
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
		await this.monitorsRepository.removeNotificationFromMonitors(id);
		const deleted = await this.notificationsRepository.deleteById(id, teamId);
		return deleted;
	};
}
