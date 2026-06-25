import { Mongoose } from "mongoose";
import { hostname } from "node:os";
import { randomUUID } from "node:crypto";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import pkg from "handlebars";
const { compile } = pkg;
import mjml2html from "mjml";

import MongoDB from "@/db/db.mongo.js";
import { IDb } from "@/db/db.interface.js";
import { ISettingsService, EnvConfig, SettingsService } from "@/domain/app-settings/app-settings.service.js";
import { ICheckService, CheckService } from "@/domain/checks/check.service.js";
import { IGeoChecksService, GeoChecksService } from "@/domain/geo-checks/geo-check.service.js";
import { IIncidentService, IncidentService } from "@/domain/incidents/incident.service.js";
import { INotificationMessageBuilder, NotificationMessageBuilder } from "@/domain/notifications/notification.message-builder.js";
import { INotificationsService, NotificationsService } from "@/domain/notifications/notification.service.js";
import { IEmailService, EmailService } from "@/service/emailService.js";
import { GlobalPingService } from "@/service/globalPingService.js";
import { ILogger } from "@/utils/logger.js";

// Notification providers
import { WebhookProvider } from "@/domain/notifications/providers/webhook.js";
import { SlackProvider } from "@/domain/notifications/providers/slack.js";
import { EmailProvider } from "@/domain/notifications/providers/email.js";
import { DiscordProvider } from "@/domain/notifications/providers/discord.js";
import { PagerDutyProvider } from "@/domain/notifications/providers/pagerduty.js";
import { MatrixProvider } from "@/domain/notifications/providers/matrix.js";
import { TeamsProvider } from "@/domain/notifications/providers/teams.js";
import { TelegramProvider } from "@/domain/notifications/providers/telegram.js";
import { PushoverProvider } from "@/domain/notifications/providers/pushover.js";
import { TwilioProvider } from "@/domain/notifications/providers/twilio.js";
import { NtfyProvider } from "@/domain/notifications/providers/ntfy.js";

// Repository interfaces
import { ISettingsRepository } from "@/domain/app-settings/app-settings-repository.interface.js";
import { IChecksRepository } from "@/domain/checks/check.repository.interface.js";
import { IGeoChecksRepository } from "@/domain/geo-checks/geo-check.repository.interface.js";
import { IIncidentsRepository } from "@/domain/incidents/incident.repository.interface.js";
import { IInvitesRepository } from "@/domain/invites/invite.repository.interface.js";
import { IJobsRepository } from "@/domain/jobs/job.repository.interface.js";
import { IMaintenanceWindowsRepository } from "@/domain/maintenance-windows/maintenance-window.repository.interface.js";
import { IMonitorStatsRepository } from "@/domain/monitor-stats/monitor-stats.repository.interface.js";
import { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";
import { INotificationsRepository } from "@/domain/notifications/notification.repository.interface.js";
import { IQueueWorkersRepository } from "@/domain/queue-workers/queue-worker.repository.interface.js";
import { IRecoveryTokensRepository } from "@/domain/recovery-tokens/recovery-token.repository.interface.js";
import { IStatusPagesRepository } from "@/domain/status-pages/status-page-repository.interface.js";
import { ITagsRepository } from "@/domain/tags/tag.repository.interface.js";
import { ITeamsRepository } from "@/domain/teams/team.repository.interface.js";
import { IUsersRepository } from "@/domain/users/user.repository.interface.js";

// Mongo repository implementations
import MongoSettingsRepository from "@/domain/app-settings/app-settings.repository.mongo.js";
import MongoChecksRepository from "@/domain/checks/check.repository.mongo.js";
import MongoGeoChecksRepository from "@/domain/geo-checks/geo-check.repository.mongo.js";
import MongoIncidentsRepository from "@/domain/incidents/incident.repository.mongo.js";
import MongoInvitesRepository from "@/domain/invites/invite.repository.mongo.js";
import MongoJobsRepository from "@/domain/jobs/job.repository.mongo.js";
import MongoMaintenanceWindowsRepository from "@/domain/maintenance-windows/maintenance-window.repository.mongo.js";
import MongoMonitorStatsRepository from "@/domain/monitor-stats/monitor-stats.repository.mongo.js";
import MongoMonitorsRepository from "@/domain/monitors/monitor.repository.mongo.js";
import MongoNotificationsRepository from "@/domain/notifications/notification.repository.mongo.js";
import MongoQueueWorkersRepository from "@/domain/queue-workers/queue-worker.repository.mongo.js";
import MongoRecoveryTokensRepository from "@/domain/recovery-tokens/recovery-token.repository.mongo.js";
import MongoStatusPagesRepository from "@/domain/status-pages/status-page-repository.mongo.js";
import MongoTagsRepository from "@/domain/tags/tag.repository.mongo.js";
import MongoTeamsRepository from "@/domain/teams/team.repository.model.js";
import MongoUsersRepository from "@/domain/users/user.repository.mongo.js";

// Script Monitor feature (custom) — repositories, interfaces, and business services
import { IScriptService, ScriptService } from "@/service/business/scriptService.js";
import { ICaptureAgentService, CaptureAgentService } from "@/service/business/captureAgentService.js";
import { IScriptRepository } from "@/repositories/scripts/IScriptRepository.js";
import { IProbeRepository } from "@/repositories/probes/IProbeRepository.js";
import { IAuditRepository } from "@/repositories/audit/IAuditRepository.js";
import { ICaptureAgentRepository } from "@/repositories/captureAgents/ICaptureAgentRepository.js";
import { ICaptureAgentDeviceRepository } from "@/repositories/captureAgentDevices/ICaptureAgentDeviceRepository.js";
import MongoScriptRepository from "@/repositories/scripts/MongoScriptRepository.js";
import MongoProbeRepository from "@/repositories/probes/MongoProbeRepository.js";
import MongoAuditRepository from "@/repositories/audit/MongoAuditRepository.js";
import MongoCaptureAgentRepository from "@/repositories/captureAgents/MongoCaptureAgentRepository.js";
import MongoCaptureAgentDeviceRepository from "@/repositories/captureAgentDevices/MongoCaptureAgentDeviceRepository.js";

// Shared infrastructure + business services that both the API and the worker process construct.
export interface SharedServices {
	logger: ILogger;
	db: IDb<Mongoose>;
	settingsService: ISettingsService;
	emailService: IEmailService;
	notificationMessageBuilder: INotificationMessageBuilder;
	incidentService: IIncidentService;
	checkService: ICheckService;
	geoChecksService: IGeoChecksService;
	notificationsService: INotificationsService;

	// Queue identity (one per process; the worker reuses these)
	workerId: string;
	jobsRepository: IJobsRepository;
	queueWorkersRepository: IQueueWorkersRepository;

	// Repositories
	monitorsRepository: IMonitorsRepository;
	checksRepository: IChecksRepository;
	geoChecksRepository: IGeoChecksRepository;
	monitorStatsRepository: IMonitorStatsRepository;
	statusPagesRepository: IStatusPagesRepository;
	usersRepository: IUsersRepository;
	invitesRepository: IInvitesRepository;
	recoveryTokensRepository: IRecoveryTokensRepository;
	settingsRepository: ISettingsRepository;
	notificationsRepository: INotificationsRepository;
	tagsRepository: ITagsRepository;
	incidentsRepository: IIncidentsRepository;
	teamsRepository: ITeamsRepository;
	maintenanceWindowsRepository: IMaintenanceWindowsRepository;

	// Script Monitor feature (custom)
	scriptsRepository: IScriptRepository;
	probesRepository: IProbeRepository;
	auditRepository: IAuditRepository;
	captureAgentsRepository: ICaptureAgentRepository;
	captureAgentDevicesRepository: ICaptureAgentDeviceRepository;
	scriptService: IScriptService;
	captureAgentService: ICaptureAgentService;
}

export const buildShared = async ({
	logger,
	envSettings,
	settingsService,
}: {
	logger: ILogger;
	envSettings: EnvConfig;
	settingsService: ISettingsService;
}): Promise<SharedServices> => {
	// Shared worker ID
	const workerId = `${hostname()}:${process.pid}:${randomUUID()}`;

	// Create DB
	let db: IDb<Mongoose> | null = null;
	db = new MongoDB(logger, envSettings);
	await db.connect();

	// Repositories
	const monitorsRepository = new MongoMonitorsRepository();
	const checksRepository = new MongoChecksRepository(logger);
	const incidentsRepository = new MongoIncidentsRepository();
	const usersRepository = new MongoUsersRepository();
	const geoChecksRepository = new MongoGeoChecksRepository(logger);
	const notificationsRepository = new MongoNotificationsRepository();
	const jobsRepository = new MongoJobsRepository(workerId);
	const queueWorkersRepository = new MongoQueueWorkersRepository();
	const monitorStatsRepository = new MongoMonitorStatsRepository();
	const statusPagesRepository = new MongoStatusPagesRepository();
	const invitesRepository = new MongoInvitesRepository();
	const recoveryTokensRepository = new MongoRecoveryTokensRepository();
	const settingsRepository = new MongoSettingsRepository();
	const tagsRepository = new MongoTagsRepository();
	const teamsRepository = new MongoTeamsRepository();
	const maintenanceWindowsRepository = new MongoMaintenanceWindowsRepository();

	// Script Monitor feature (custom) repositories
	const scriptsRepository = new MongoScriptRepository();
	const probesRepository = new MongoProbeRepository();
	const auditRepository = new MongoAuditRepository();
	const captureAgentsRepository = new MongoCaptureAgentRepository();
	const captureAgentDevicesRepository = new MongoCaptureAgentDeviceRepository();

	// Inject settings repository into settings service (now that DB is connected)
	(settingsService as SettingsService).setRepository(settingsRepository);

	// Services
	const notificationMessageBuilder = new NotificationMessageBuilder();
	const emailService = new EmailService(settingsService, fs, path, compile, mjml2html, nodemailer, logger);
	const incidentService = new IncidentService(logger, incidentsRepository, monitorsRepository, usersRepository, notificationMessageBuilder);
	const checkService = new CheckService(monitorsRepository, logger, checksRepository);

	const globalPingService = new GlobalPingService(logger);
	const geoChecksService = new GeoChecksService({
		logger,
		geoChecksRepository,
		globalPingService,
		monitorsRepository,
	});

	const webhookProvider = new WebhookProvider(logger);
	const slackProvider = new SlackProvider(logger);
	const emailProvider = new EmailProvider(emailService, logger);
	const discordProvider = new DiscordProvider(logger);
	const pagerDutyProvider = new PagerDutyProvider(logger);
	const matrixProvider = new MatrixProvider(logger);
	const teamsProvider = new TeamsProvider(logger);
	const telegramProvider = new TelegramProvider(logger);
	const pushoverProvider = new PushoverProvider(logger);
	const twilioProvider = new TwilioProvider(logger);
	const ntfyProvider = new NtfyProvider(logger);

	const notificationsService = new NotificationsService(
		notificationsRepository,
		monitorsRepository,
		webhookProvider,
		emailProvider,
		slackProvider,
		discordProvider,
		pagerDutyProvider,
		matrixProvider,
		teamsProvider,
		telegramProvider,
		pushoverProvider,
		twilioProvider,
		ntfyProvider,
		settingsService,
		logger,
		notificationMessageBuilder
	);

	// Script Monitor feature (custom) business services
	const scriptService = new ScriptService({
		scriptRepository: scriptsRepository,
		probeRepository: probesRepository,
		auditRepository,
		captureAgentRepository: captureAgentsRepository,
		captureAgentDeviceRepository: captureAgentDevicesRepository,
		logger,
	});
	const captureAgentService = new CaptureAgentService({
		captureAgentRepository: captureAgentsRepository,
		captureAgentDeviceRepository: captureAgentDevicesRepository,
		auditRepository,
		logger,
	});

	const sharedServices: SharedServices = {
		logger,
		db,
		settingsService,
		emailService,
		notificationMessageBuilder,
		incidentService,
		checkService,
		geoChecksService,
		notificationsService,
		workerId,
		jobsRepository,
		monitorsRepository,
		queueWorkersRepository,
		checksRepository,
		geoChecksRepository,
		monitorStatsRepository,
		statusPagesRepository,
		usersRepository,
		invitesRepository,
		recoveryTokensRepository,
		settingsRepository,
		notificationsRepository,
		tagsRepository,
		incidentsRepository,
		teamsRepository,
		maintenanceWindowsRepository,
		scriptsRepository,
		probesRepository,
		auditRepository,
		captureAgentsRepository,
		captureAgentDevicesRepository,
		scriptService,
		captureAgentService,
	};
	return sharedServices;
};
