import type { Monitor } from "@/domain/monitors/monitor.type.js";
import type { Notification } from "@/domain/notifications/notification.type.js";
import { NotificationCredentialFields, NotificationDestinationFields, NotificationSecretFields } from "@/domain/notifications/notification.type.js";
import { AppError } from "@/utils/AppError.js";
import type { MonitorStatusResponse } from "@/types/network.js";
import type { NotificationMessage } from "@/domain/notifications/notification.type.js";
import { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";
import { INotificationsRepository } from "@/domain/notifications/notification.repository.interface.js";
import { INotificationProvider } from "@/domain/notifications/providers/INotificationProvider.js";
import type { MonitorActionDecision } from "@/worker/worker.helper.js";
import type { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import { ILogger } from "@/utils/logger.js";
import type { INotificationMessageBuilder } from "@/domain/notifications/notification.message-builder.js";
import type { NotificationChannel, NotificationSecretField } from "@/domain/notifications/notification.type.js";

export type NotificationProviderRegistry = Record<NotificationChannel, INotificationProvider>;

export interface INotificationsService {
	createNotification: (notificationData: Partial<Notification>, userId: string, teamId: string) => Promise<Notification>;
	findById: (id: string, teamId: string) => Promise<Notification>;
	findNotificationsByTeamId: (teamId: string) => Promise<Notification[]>;
	updateById(id: string, teamId: string, updateData: Partial<Notification>): Promise<Notification>;
	deleteById: (id: string, teamId: string) => Promise<Notification>;
	handleNotifications: (monitor: Monitor, monitorStatusResponse: MonitorStatusResponse, decision: MonitorActionDecision) => Promise<boolean>;

	sendTestNotification: (notification: Partial<Notification>) => Promise<boolean>;
	sendTestNotificationById: (id: string, teamId: string, notification: Partial<Notification>) => Promise<boolean>;
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
		const provider = this.providers[notification.type];
		if (!provider) {
			this.logger.warn({
				message: `Unknown notification type: ${notification.type}`,
				service: SERVICE_NAME,
				method: "send",
			});
			return false;
		}
		return await provider.sendMessage(notification, notificationMessage);
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

	sendTestNotification = async (notification: Partial<Notification>) => {
		const type = notification.type;
		if (!type) {
			this.logger.warn({
				message: "Notification type not provided",
				service: SERVICE_NAME,
				method: "sendTestNotification",
			});
			return false;
		}

		const provider = this.providers[type];
		if (!provider) {
			this.logger.warn({
				message: `Unknown notification type: ${notification.type}`,
				service: SERVICE_NAME,
				method: "sendTestNotification",
			});
			return false;
		}
		return await provider.sendTestAlert(notification);
	};

	// Secrets a channel's provider actually authenticates with. A credential stored against a channel
	// whose provider never reads one is inert, so it must not constrain that channel: treating it as
	// live left records with a leftover credential unable to change their address at all, and channels
	// whose schema drops the field could not even clear it.
	//
	// The fallback is defensive only. Every request body is a discriminated union over the known
	// channels, so an unrecognised type cannot arrive through the API; it exists so that a hand-edited
	// document errs towards guarding the credential rather than skipping the check.
	private credentialFieldsFor = (type: NotificationChannel): readonly NotificationSecretField[] =>
		(NotificationCredentialFields[type] as readonly NotificationSecretField[] | undefined) ?? NotificationSecretFields;

	// Secrets a request leaves to the stored record, by omitting them. A stored empty credential counts
	// as no credential, the same way the API reports it.
	private keptSecretFields = (notification: Partial<Notification>, storedNotification: Notification): readonly NotificationSecretField[] =>
		this.credentialFieldsFor(storedNotification.type).filter((field) => notification[field] === undefined && Boolean(storedNotification[field]));

	// A credential the server supplies on the caller's behalf may only ever reach the destination it is
	// already stored against. A request that keeps a stored credential and repoints the channel at the
	// same time has to supply that credential explicitly, otherwise the caller could name a host they
	// control and have the server deliver the secret there. Applies to both testing and saving,
	// because a saved change reaches the same place on the next alert.
	private assertKeptCredentialStaysPut = (
		notification: Partial<Notification>,
		storedNotification: Notification,
		keptSecrets: readonly NotificationSecretField[],
		method: string
	): void => {
		if (keptSecrets.length === 0) return;

		const destinationFields = NotificationDestinationFields[storedNotification.type] as readonly (keyof Notification)[] | undefined;
		if (destinationFields === undefined) {
			// Defensive, like the fallback above: unreachable through the API, since a stored type the
			// validators do not know is always a type change, which sheds the credential before this runs.
			throw new AppError({
				message: "This channel's type is not recognised, so its stored credentials cannot be reused",
				status: 400,
				service: SERVICE_NAME,
				method,
			});
		}

		// An absent field counts as changed, which fails closed. That only stays comfortable while every
		// destination field is required by its channel's schema: make one optional, and a patch that
		// legitimately omits it starts being refused with an instruction the caller cannot act on.
		const destinationChanged = destinationFields.some((field) => notification[field] !== storedNotification[field]);

		if (destinationChanged) {
			throw new AppError({
				message: "Enter the credentials again to use this channel with a different destination",
				status: 400,
				service: SERVICE_NAME,
				method,
			});
		}
	};

	// Tests a saved channel. Credentials the client left out are filled in from the stored record so
	// that a channel can be tested without the client ever holding its secret. A backfilled secret is
	// only ever allowed to travel to the destination it is already stored against: if the caller
	// changed where the notification is delivered, the credential has to be supplied explicitly.
	sendTestNotificationById = async (id: string, teamId: string, notification: Partial<Notification>): Promise<boolean> => {
		const storedNotification = await this.notificationsRepository.findById(id, teamId);

		if (notification.type !== storedNotification.type) {
			throw new AppError({
				message: "Notification type does not match the saved channel",
				status: 400,
				service: SERVICE_NAME,
				method: "sendTestNotificationById",
			});
		}

		const backfilledFields = this.keptSecretFields(notification, storedNotification);
		this.assertKeptCredentialStaysPut(notification, storedNotification, backfilledFields, "sendTestNotificationById");

		const testNotification: Partial<Notification> = { ...notification };
		for (const field of backfilledFields) {
			testNotification[field] = storedNotification[field];
		}

		return await this.sendTestNotification(testNotification);
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

	// An edit that omits a credential keeps the stored one, so it is subject to the same rule as a test:
	// a kept credential may not be repointed. Without this, the guard on the test path could be walked
	// around in two requests: save the new destination first, which leaves stored and incoming
	// agreeing, then test. A saved change is also worse than a test, because every later alert carries
	// the credential to the new destination too.
	updateById = async (id: string, teamId: string, updateData: Partial<Notification>): Promise<Notification> => {
		const storedNotification = await this.notificationsRepository.findById(id, teamId);
		const patch: Partial<Notification> = { ...updateData };
		const targetType = updateData.type;

		if (targetType !== undefined && targetType !== storedNotification.type) {
			// A credential is issued by one provider and means nothing to another, so it must not follow a
			// channel to a different type. It is dropped rather than demanded back, because the target
			// provider's schema need not accept the field at all, which would make a refusal impossible to
			// satisfy. Every stored secret goes, not only the ones this channel could use, so a conversion
			// never carries someone else's leftovers forward.
			for (const field of NotificationSecretFields) {
				if (patch[field] === undefined && Boolean(storedNotification[field])) {
					patch[field] = "";
				}
			}

			// The channel still has to be able to send afterwards. Leaving it credential-less would look
			// configured and silently never deliver, which is the worst outcome for a monitoring tool, and
			// creating the same channel from scratch is rejected. So ask for the new provider's credential
			// instead of quietly producing a dead channel.
			const missingCredentials = this.credentialFieldsFor(targetType).filter((field) => !patch[field]);
			if (missingCredentials.length > 0) {
				throw new AppError({
					message: "Enter the credentials for the channel type you are switching to",
					status: 400,
					service: SERVICE_NAME,
					method: "updateById",
				});
			}
		}

		// Runs on every path, including after a conversion. Clearing already left nothing kept, so this is
		// a no-op there rather than skipped: clearing and guarding are not alternatives, and the guard must
		// not depend on the cleared write actually landing.
		this.assertKeptCredentialStaysPut(patch, storedNotification, this.keptSecretFields(patch, storedNotification), "updateById");

		return await this.notificationsRepository.updateById(id, teamId, patch);
	};

	deleteById = async (id: string, teamId: string): Promise<Notification> => {
		await this.monitorsRepository.removeNotificationFromMonitors(id);
		const deleted = await this.notificationsRepository.deleteById(id, teamId);
		return deleted;
	};
}
