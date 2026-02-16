import type { HardwareStatusPayload, Monitor, MonitorStatusResponse, Notification, MonitorStatus } from "@/types/index.js";
import { IMonitorsRepository, INotificationsRepository } from "@/repositories/index.js";
import { INotificationProvider } from "./notificationProviders/INotificationProvider.js";
import type { MonitorActionDecision } from "@/service/infrastructure/SuperSimpleQueue/SuperSimpleQueueHelper.js";
import type { ISettingsService } from "@/service/system/settingsService.js";

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
	private logger: any;
	private settingsService: ISettingsService;

	// Email grouping (batching) configuration
	private emailGroupingWindowMs: number;
	private pendingEmailGroups: Map<
		string,
		{
			monitors: Monitor[];
			statusResponses: MonitorStatusResponse[];
			timer: ReturnType<typeof setTimeout>;
			createdAt: number;
		}
	>;
	private currentDecision?: MonitorActionDecision;

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
		logger: any
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

		// Configure email grouping window (in milliseconds).
		// When > 0, multiple DOWN events for monitors that share the same
		// email notification within this window will be batched into a single email.
		const rawGroupingWindow = process.env.NOTIFICATION_GROUP_WINDOW_MS ?? process.env.NOTIFICATION_GROUP_WINDOW_SECONDS;
		let groupingWindowMs = 0;
		if (rawGroupingWindow) {
			const parsed = Number(rawGroupingWindow);
			if (!Number.isNaN(parsed) && parsed > 0) {
				// If value looks like seconds (small number), convert to ms.
				// This allows either milliseconds (e.g. 60000) or seconds (e.g. 60).
				groupingWindowMs = parsed <= 300 ? parsed * 1000 : parsed;
			}
		}
		this.emailGroupingWindowMs = groupingWindowMs;
		this.pendingEmailGroups = new Map();
	}

	private send = async (notification: Notification, monitor: Monitor, monitorStatusResponse: MonitorStatusResponse): Promise<boolean> => {
		const settings = this.settingsService.getSettings();
		const clientHost = settings.clientHost || "Host not defined";
		switch (notification.type) {
			case "email":
				return await this.emailProvider.sendAlert(notification, monitor, monitorStatusResponse, this.currentDecision!, clientHost);
			case "slack":
				return await this.slackProvider.sendAlert(notification, monitor, monitorStatusResponse, this.currentDecision!, clientHost);
			case "discord":
				return await this.discordProvider.sendAlert(notification, monitor, monitorStatusResponse, this.currentDecision!, clientHost);
			case "pager_duty":
				return await this.pagerDutyProvider.sendAlert(notification, monitor, monitorStatusResponse, this.currentDecision!, clientHost);
			case "matrix":
				return await this.matrixProvider.sendAlert(notification, monitor, monitorStatusResponse, this.currentDecision!, clientHost);
			case "webhook":
				return await this.webhookProvider.sendAlert(notification, monitor, monitorStatusResponse, this.currentDecision!, clientHost);
			default:
				return false;
		}
	};

	private sendNotifications = async (monitor: Monitor, monitorStatusResponse: MonitorStatusResponse) => {
		const notificationIds = monitor.notifications ?? [];
		const notifications = await this.notificationsRepository.findNotificationsByIds(notificationIds);

		const tasks = notifications.map((notification) => {
			// Only group emails, only for DOWN transitions, and only if a window is configured.
			if (notification.type === "email" && this.emailGroupingWindowMs > 0 && monitorStatusResponse.status === false) {
				return this.queueGroupedEmailNotification(notification, monitor, monitorStatusResponse);
			}

			// For all other cases (UP notifications or non-email channels), send immediately.
			return this.send(notification, monitor, monitorStatusResponse);
		});

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

	/**
	 * Queue a DOWN email notification to be potentially grouped with other
	 * DOWN events for the same email notification within the configured window.
	 *
	 * This method returns immediately; the actual email is sent asynchronously
	 * when the grouping window expires.
	 */
	private queueGroupedEmailNotification = async (
		notification: Notification,
		monitor: Monitor,
		monitorStatusResponse: MonitorStatusResponse
	): Promise<boolean> => {
		// If grouping is disabled, fallback to immediate send.
		if (this.emailGroupingWindowMs <= 0) {
			return await this.send(notification, monitor, monitorStatusResponse);
		}

		const key = notification.id;
		const now = Date.now();
		const existingGroup = this.pendingEmailGroups.get(key);

		if (!existingGroup) {
			// Create a new group and schedule a flush after the window expires.
			const timer = setTimeout(async () => {
				const group = this.pendingEmailGroups.get(key);
				if (!group) return;

				this.pendingEmailGroups.delete(key);

				try {
					// For grouped notifications (always DOWN), create a decision
					const groupedDecision: MonitorActionDecision = {
						shouldCreateIncident: false,
						shouldResolveIncident: false,
						shouldSendNotification: true,
						incidentReason: "status_down",
						notificationReason: "status_change",
					};
					await this.flushEmailGroup(notification, group.monitors, group.statusResponses, groupedDecision);
				} catch (error: any) {
					this.logger.error({
						message: error?.message,
						service: SERVICE_NAME,
						method: "flushEmailGroup",
						stack: error?.stack,
					});
				}
			}, this.emailGroupingWindowMs);

			this.pendingEmailGroups.set(key, {
				monitors: [monitor],
				statusResponses: [monitorStatusResponse],
				timer,
				createdAt: now,
			});
		} else {
			// Append to existing group.
			existingGroup.monitors.push(monitor);
			existingGroup.statusResponses.push(monitorStatusResponse);
		}

		// Consider queueing as "succeeded" from the caller's perspective.
		return true;
	};

	/**
	 * Flush a grouped set of DOWN events into a single email.
	 *
	 * To avoid changing email templates, we construct a synthetic Monitor
	 * whose name concisely lists all affected services. The existing
	 * `serverIsDownTemplate` is then reused.
	 *
	 * @param notification The email notification to send to
	 * @param monitors Array of monitors that went down
	 * @param statusResponses Array of status responses (parallel to monitors)
	 * @returns true if email was sent successfully, false otherwise
	 */
	private flushEmailGroup = async (
		notification: Notification,
		monitors: Monitor[],
		statusResponses: MonitorStatusResponse[],
		decision: MonitorActionDecision
	): Promise<boolean> => {
		if (!monitors.length || !statusResponses.length) {
			return false;
		}

		const { clientHost } = this.settingsService.getSettings();
		if (!clientHost) {
			this.logger.warn({ message: "CLIENT_HOST not configured", service: SERVICE_NAME, method: "flushEmailGroup" });
			return false;
		}

		// Build a combined monitor name listing all affected services.
		// Example: "Service A, Service B" (2 services) or "Service A" (1 service)
		const uniqueNames = Array.from(new Set(monitors.map((m) => m.name)));
		const servicesCount = uniqueNames.length;
		const servicesList = uniqueNames.join(", ");

		const combinedName = servicesCount === 1 ? servicesList : `${servicesCount} services: ${servicesList}`;

		// Use the first monitor as a base for URL and other fields.
		const baseMonitor = monitors[0]!;
		const baseStatus = statusResponses[0]!;

		// Create a shallow clone so we don't mutate the original entity.
		// This preserves monitor properties while overriding the name for grouped display.
		const syntheticMonitor: Monitor = {
			...baseMonitor,
			name: combinedName,
		};

		// Reuse existing email provider to send grouped notification.
		return await this.emailProvider.sendAlert(notification, syntheticMonitor, baseStatus, decision, clientHost);
	};

	handleNotifications = async (monitor: Monitor, monitorStatusResponse: MonitorStatusResponse, decision: MonitorActionDecision) => {
		// Early return if no notification should be sent
		if (!decision.shouldSendNotification) {
			return false;
		}

		// Store decision for use in send method
		this.currentDecision = decision;

		// Send notifications based on decision
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
