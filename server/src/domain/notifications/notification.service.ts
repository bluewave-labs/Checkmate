import type { Monitor } from "@/domain/monitors/monitor.type.js";
import { EgressExcludedChannels, type Notification } from "@/domain/notifications/notification.type.js";
import type { NotificationMessage } from "@/domain/notifications/notification.type.js";
import { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";
import { INotificationsRepository } from "@/domain/notifications/notification.repository.interface.js";
import { INotificationProvider } from "@/domain/notifications/providers/INotificationProvider.js";
import type { MonitorActionDecision } from "@/worker/worker.interface.js";
import type { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import { ILogger } from "@/utils/logger/logger.js";
import type { INotificationMessageBuilder } from "@/domain/notifications/notification.message-builder.js";
import type { NotificationChannel } from "@/domain/notifications/notification.type.js";
import { CLIENT_HOST_FALLBACK } from "@/domain/notifications/providers/utils.js";
import type { EgressState } from "@/domain/egress/egress.type.js";
import type { Check } from "@/domain/checks/check.type.js";
import { appSettingsErrors } from "@/domain/app-settings/app-settings.errors.js";
import { AppError } from "@/utils/AppError.js";

export type NotificationProviderRegistry = Record<NotificationChannel, INotificationProvider>;

export interface INotificationsService {
	createNotification: (notificationData: Partial<Notification>, userId: string, teamId: string) => Promise<Notification>;
	findById: (id: string, teamId: string) => Promise<Notification>;
	findNotificationsByTeamId: (teamId: string) => Promise<Notification[]>;
	assertNotificationsExistForTeam: (ids: string[], teamId: string) => Promise<void>;
	findEgressNotificationScopeForTeam: (requestedIds: string[], teamId: string) => Promise<string[]>;
	updateById(id: string, teamId: string, updateData: Partial<Notification>): Promise<Notification>;
	deleteById: (id: string, teamId: string) => Promise<Notification>;
	handleNotifications: (monitor: Monitor, check: Check, decision: MonitorActionDecision) => Promise<boolean>;

	// Instance-level (not monitor-scoped): sent once when outbound connectivity returns after a degraded egress episode.
	sendEgressRecoveredNotification: (state: EgressState, notificationIds: string[]) => Promise<boolean>;

	sendTestNotification: (notification: Partial<Notification>) => Promise<boolean>;
	testAllNotifications: (notificationIds: string[]) => Promise<boolean>;
}

const SERVICE_NAME = "NotificationsService";

export class NotificationsService implements INotificationsService {
	static SERVICE_NAME = SERVICE_NAME;

	private notificationsRepository: INotificationsRepository;
	private monitorsRepository: IMonitorsRepository;
	private providers: NotificationProviderRegistry;
	private settingsService: ISettingsService;
	private logger: ILogger;
	private notificationMessageBuilder: INotificationMessageBuilder;

	constructor({
		notificationsRepository,
		monitorsRepository,
		providers,
		settingsService,
		logger,
		notificationMessageBuilder,
	}: {
		notificationsRepository: INotificationsRepository;
		monitorsRepository: IMonitorsRepository;
		providers: NotificationProviderRegistry;
		settingsService: ISettingsService;
		logger: ILogger;
		notificationMessageBuilder: INotificationMessageBuilder;
	}) {
		this.notificationsRepository = notificationsRepository;
		this.monitorsRepository = monitorsRepository;
		this.providers = providers;
		this.settingsService = settingsService;
		this.logger = logger.child({ service: SERVICE_NAME });
		this.notificationMessageBuilder = notificationMessageBuilder;
	}

	private resolveClientHost = (): string => {
		return this.settingsService.getSettings().clientHost || CLIENT_HOST_FALLBACK;
	};

	private send = async (notification: Notification, notificationMessage: NotificationMessage | undefined): Promise<boolean> => {
		if (!notificationMessage) {
			this.logger.warn("Notification message not provided");
			return false;
		}

		// Route to provider based on notification type
		const provider = this.providers[notification.type];
		if (!provider) {
			this.logger.warn({ type: notification.type }, "Unknown notification type");
			return false;
		}
		return await provider.sendMessage(notification, notificationMessage);
	};

	private sendNotifications = async (monitor: Monitor, check: Check, decision: MonitorActionDecision) => {
		const notificationIds = monitor.notifications ?? [];
		const notifications = await this.notificationsRepository.findNotificationsByIds(notificationIds);

		// Build notification message once for all notifications
		const clientHost = this.resolveClientHost();
		const notificationMessage = this.notificationMessageBuilder.buildMessage(monitor, check, decision, clientHost);

		return await this.sendToAll(notifications, notificationMessage);
	};

	private sendToAll = async (notifications: Notification[], notificationMessage: NotificationMessage | undefined) => {
		const tasks = notifications.map((notification) => this.send(notification, notificationMessage));

		const outcomes = await Promise.all(tasks);
		const succeeded = outcomes.filter(Boolean).length;
		const failed = outcomes.length - succeeded;
		if (failed > 0) {
			this.logger.warn({ succeeded, failed }, "Notification send completed with failures");
		}
		// Return true if all notifications succeeded
		return succeeded === notifications.length;
	};

	sendEgressRecoveredNotification = async (state: EgressState, notificationIds: string[]) => {
		if (notificationIds.length === 0) {
			this.logger.info("Egress recovered but no notification channels are configured for it");
			return true;
		}

		const notifications = await this.notificationsRepository.findNotificationsByIds(notificationIds);
		if (notifications.length === 0) {
			this.logger.warn({ notificationIds }, "Egress recovered but none of the configured notification channels exist");
			return true;
		}

		const isExcluded = (notification: Notification) => EgressExcludedChannels.some((channel) => channel === notification.type);

		const skipped = notifications.filter(isExcluded);
		const eligible = notifications.filter((notification) => !isExcluded(notification));

		if (skipped.length > 0) {
			this.logger.warn(
				{ skippedIds: skipped.map((notification) => notification.id) },
				"Egress recovered; skipping notification channels that cannot receive egress alerts"
			);
		}
		if (eligible.length === 0) {
			return true;
		}

		const clientHost = this.resolveClientHost();
		const notificationMessage = this.notificationMessageBuilder.buildEgressRecoveredMessage(state, clientHost);

		return await this.sendToAll(eligible, notificationMessage);
	};

	handleNotifications = async (monitor: Monitor, check: Check, decision: MonitorActionDecision) => {
		if (decision.transition === null) return false;

		// Send notifications based on decision
		return await this.sendNotifications(monitor, check, decision);
	};

	sendTestNotification = async (notification: Partial<Notification>) => {
		const type = notification.type;
		if (!type) {
			this.logger.warn("Notification type not provided");
			return false;
		}

		const provider = this.providers[type];
		if (!provider) {
			this.logger.warn({ type: notification.type }, "Unknown notification type");
			return false;
		}
		return await provider.sendTestAlert(notification);
	};

	testAllNotifications = async (notificationIds: string[]) => {
		const notifications = await this.notificationsRepository.findNotificationsByIds(notificationIds);
		const tasks = notifications.map((notification) =>
			this.sendTestNotification(notification).catch((error: unknown) => {
				this.logger.warn({ err: error, notificationId: notification.id, type: notification.type }, "Test notification failed");
				return false;
			})
		);
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

	// Egress notifications are one instance-wide list, but each admin sees and edits only their own team's channels.
	// Checks the requested ids belong to the team and returns all of the team's ids: the share of the list the request
	// replaces, leaving other teams' channels as stored.
	findEgressNotificationScopeForTeam = async (requestedIds: string[], teamId: string): Promise<string[]> => {
		await this.assertNotificationsExistForTeam(requestedIds, teamId);
		return (await this.notificationsRepository.findByTeamId(teamId)).map((notification) => notification.id);
	};

	// Only the team's own notifications can be referenced; an id from another team is reported as missing, not forbidden.
	assertNotificationsExistForTeam = async (ids: string[], teamId: string): Promise<void> => {
		if (ids.length === 0) return;
		const found = await this.notificationsRepository.findNotificationsByIdsForTeam(ids, teamId);
		const foundIds = new Set(found.map((notification) => notification.id));
		const missing = ids.filter((id) => !foundIds.has(id));
		if (missing.length > 0) {
			throw new AppError(appSettingsErrors.notificationNotFound, {
				message: `Referenced notification does not exist: ${missing.join(", ")}`,
				service: SERVICE_NAME,
				method: "assertNotificationsExistForTeam",
			});
		}
		if (found.some((notification) => EgressExcludedChannels.some((channel) => channel === notification.type))) {
			throw new AppError(appSettingsErrors.notificationChannelNotSupported, {
				service: SERVICE_NAME,
				method: "assertNotificationsExistForTeam",
			});
		}
	};

	updateById = async (id: string, teamId: string, updateData: Partial<Notification>): Promise<Notification> => {
		return await this.notificationsRepository.updateById(id, teamId, updateData);
	};

	deleteById = async (id: string, teamId: string): Promise<Notification> => {
		await this.monitorsRepository.removeNotificationFromMonitors(id);
		const deleted = await this.notificationsRepository.deleteById(id, teamId);
		// App settings hold notification ids for the egress recovered alert; drop the deleted one so it never dangles.
		// After the team-scoped delete, so a request for another team's id (404 above) cannot touch instance settings.
		await this.settingsService.removeEgressNotification(id);
		return deleted;
	};
}
