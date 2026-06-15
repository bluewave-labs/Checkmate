import { Mongoose } from "mongoose";
import { hostname } from "node:os";
import { randomUUID } from "node:crypto";
import MongoDB from "../db/db.mongo.js";
import { IDb } from "@/db/db.interface.js";
import { EnvConfig, ISettingsService, SettingsService } from "@/domain/app-settings/app-settings.service.js";
import { CheckService, ICheckService } from "@/domain/checks/check.service.js";
import { DiagnosticService, IDiagnosticService } from "@/domain/diagnostics/diagnostic.service.js";
import { GeoChecksService, IGeoChecksService } from "@/domain/geo-checks/geo-check.service.js";
import { IIncidentService, IncidentService } from "@/domain/incidents/incident.service.js";
import { IInviteService, InviteService } from "@/domain/invites/invite.service.js";
import { IMaintenanceWindowService, MaintenanceWindowService } from "@/domain/maintenance-windows/maintenance-window.service.js";
import { IMonitorService, MonitorService } from "@/domain/monitors/monitor.service.js";
import { INotificationMessageBuilder, NotificationMessageBuilder } from "@/domain/notifications/notification.message-builder.js";
import { INotificationsService, NotificationsService } from "@/domain/notifications/notification.service.js";
import { DiscordProvider } from "@/domain/notifications/providers/discord.js";
import { EmailProvider } from "@/domain/notifications/providers/email.js";
import { MatrixProvider } from "@/domain/notifications/providers/matrix.js";
import { NtfyProvider } from "@/domain/notifications/providers/ntfy.js";
import { PagerDutyProvider } from "@/domain/notifications/providers/pagerduty.js";
import { PushoverProvider } from "@/domain/notifications/providers/pushover.js";
import { SlackProvider } from "@/domain/notifications/providers/slack.js";
import { TeamsProvider } from "@/domain/notifications/providers/teams.js";
import { TelegramProvider } from "@/domain/notifications/providers/telegram.js";
import { TwilioProvider } from "@/domain/notifications/providers/twilio.js";
import { WebhookProvider } from "@/domain/notifications/providers/webhook.js";
import { IStatusPageService, StatusPageService } from "@/domain/status-pages/status-page.service.js";
import { ITagsService, TagsService } from "@/domain/tags/tag.service.js";
import { IUserService, UserService } from "@/domain/users/user.service.js";
import { BufferService, IBufferService } from "@/service/bufferService.js";
import { EmailService, IEmailService } from "@/service/emailService.js";
import { GlobalPingService } from "@/service/globalPingService.js";
import { WorkerHelper } from "@/worker/worker.helper.js";
import { IWorker } from "@/worker/worker.interface.js";
import { INetworkService, NetworkService } from "@/service/networkService.js";
import { IStatusService, StatusService } from "@/service/statusService.js";
import { MonitorStatusPolicy } from "@/worker/worker.monitor-status-policy.js";

// Network providers
import { PingProvider } from "@/service/network/PingProvider.js";
import { HttpProvider } from "@/service/network/HttpProvider.js";
import { AdvancedMatcher } from "@/service/network/AdvancedMatcher.js";
import { PageSpeedProvider } from "@/service/network/PageSpeedProvider.js";
import { HardwareProvider } from "@/service/network/HardwareProvider.js";
import { DockerProvider } from "@/service/network/DockerProvider.js";
import { PortProvider } from "@/service/network/PortProvider.js";
import { GameProvider } from "@/service/network/GameProvider.js";
import { GrpcProvider } from "@/service/network/GrpcProvider.js";
import { WebSocketProvider } from "@/service/network/WebSocketProvider.js";
import { DNSProvider } from "@/service/network/DNSProvider.js";

// Third-party
import { Resolver } from "dns/promises";
import axios from "axios";
import got from "got";
import ping from "ping";
import Docker from "dockerode";
import net from "net";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import pkg from "handlebars";
const { compile } = pkg;
import mjml2html from "mjml";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { games, GameDig } from "gamedig";
import jmespath from "jmespath";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import WebSocket from "ws";

// Repositories
import { ISettingsRepository } from "@/domain/app-settings/app-settings-repository.interface.js";
import MongoSettingsRepository from "@/domain/app-settings/app-settings.repository.mongo.js";
import { IChecksRepository } from "@/domain/checks/check.repository.interface.js";
import MongoChecksRepository from "@/domain/checks/check.repository.mongo.js";
import { IGeoChecksRepository } from "@/domain/geo-checks/geo-check.repository.interface.js";
import MongoGeoChecksRepository from "@/domain/geo-checks/geo-check.repository.mongo.js";
import { IIncidentsRepository } from "@/domain/incidents/incident.repository.interface.js";
import MongoIncidentsRepository from "@/domain/incidents/incident.repository.mongo.js";
import { IInvitesRepository } from "@/domain/invites/invite.repository.interface.js";
import MongoInvitesRepository from "@/domain/invites/invite.repository.mongo.js";
import { IMaintenanceWindowsRepository } from "@/domain/maintenance-windows/maintenance-window.repository.interface.js";
import MongoMaintenanceWindowsRepository from "@/domain/maintenance-windows/maintenance-window.repository.mongo.js";
import { IMonitorStatsRepository } from "@/domain/monitor-stats/monitor-stats.repository.interface.js";
import MongoMonitorStatsRepository from "@/domain/monitor-stats/monitor-stats.repository.mongo.js";
import { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";
import MongoMonitorsRepository from "@/domain/monitors/monitor.repository.mongo.js";
import { INotificationsRepository } from "@/domain/notifications/notification.repository.interface.js";
import MongoNotificationsRepository from "@/domain/notifications/notification.repository.mongo.js";
import { IRecoveryTokensRepository } from "@/domain/recovery-tokens/recovery-token.repository.interface.js";
import MongoRecoveryTokensRepository from "@/domain/recovery-tokens/recovery-token.repository.mongo.js";
import { IStatusPagesRepository } from "@/domain/status-pages/status-page-repository.interface.js";
import MongoStatusPagesRepository from "@/domain/status-pages/status-page-repository.mongo.js";
import { ITagsRepository } from "@/domain/tags/tag.repository.interface.js";
import MongoTagsRepository from "@/domain/tags/tag.repository.mongo.js";
import { ITeamsRepository } from "@/domain/teams/team.repository.interface.js";
import MongoTeamsRepository from "@/domain/teams/team.repository.model.js";
import { IUsersRepository } from "@/domain/users/user.repository.interface.js";
import MongoUsersRepository from "@/domain/users/user.repository.mongo.js";
import { ILogger } from "@/utils/logger.js";
import { NotificationReactor } from "@/worker/reactors/reactor.notification.js";
import { ReactorDispatcher } from "@/worker/reactors/reactor.dispatcher.js";
import { IncidentReactor } from "@/worker/reactors/reactor.incident.js";
import { CheckPipeline, GeoChecksPipeline } from "@/worker/worker.check-pipeline.js";
import { CheckProducer } from "@/worker/worker.check-producer.js";
import { CheckEvaluator } from "@/worker/worker.check-evaluator.js";
import { DBQueueWorker } from "@/worker/worker.db-queue.js";
import MongoJobsRepository from "@/domain/jobs/job.repository.mongo.js";
import MongoQueueWorkersRepository from "@/domain/queue-workers/queue-worker.repository.mongo.js";

export type InitializedServices = {
	settingsService: ISettingsService;
	db: IDb<Mongoose>;
	networkService: INetworkService;
	emailService: IEmailService;
	bufferService: IBufferService;
	statusService: IStatusService;
	worker: IWorker;
	userService: IUserService;
	checkService: ICheckService;
	geoChecksService: IGeoChecksService;
	diagnosticService: IDiagnosticService;
	inviteService: IInviteService;
	maintenanceWindowService: IMaintenanceWindowService;
	monitorService: IMonitorService;
	incidentService: IIncidentService;
	logger: ILogger;
	notificationsService: INotificationsService;
	tagsService: ITagsService;
	statusPageService: IStatusPageService;
	notificationMessageBuilder: INotificationMessageBuilder;

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
};

export const initializeServices = async ({
	logger,
	envSettings,
	settingsService,
}: {
	logger: ILogger;
	envSettings: EnvConfig;
	settingsService: ISettingsService;
}): Promise<InitializedServices> => {
	// Create DB

	let db: IDb<Mongoose> | null = null;
	db = new MongoDB(logger, envSettings);
	await db.connect();

	const monitorsRepository = new MongoMonitorsRepository();
	const checksRepository = new MongoChecksRepository(logger);
	const geoChecksRepository = new MongoGeoChecksRepository(logger);
	const monitorStatsRepository = new MongoMonitorStatsRepository();
	const statusPagesRepository = new MongoStatusPagesRepository();
	const usersRepository = new MongoUsersRepository();
	const invitesRepository = new MongoInvitesRepository();
	const recoveryTokensRepository = new MongoRecoveryTokensRepository();
	const settingsRepository = new MongoSettingsRepository();
	const notificationsRepository = new MongoNotificationsRepository();
	const tagsRepository = new MongoTagsRepository();
	const incidentsRepository = new MongoIncidentsRepository();
	const teamsRepository = new MongoTeamsRepository();
	const maintenanceWindowsRepository = new MongoMaintenanceWindowsRepository();
	// One identity per process
	const workerId = `${hostname()}:${process.pid}:${randomUUID()}`;
	const jobsRepository = new MongoJobsRepository(workerId);
	const queueWorkersRepository = new MongoQueueWorkersRepository();

	// Inject settings repository into settings service (now that DB is connected)
	(settingsService as SettingsService).setRepository(settingsRepository);

	// Network providers
	const pingProvider = new PingProvider(ping);
	const httpProvider = new HttpProvider(got, new AdvancedMatcher(jmespath));
	const pageSpeedProvider = new PageSpeedProvider(httpProvider, settingsService, logger);
	const hardwareProvider = new HardwareProvider(httpProvider);
	const dockerProvider = new DockerProvider(logger, Docker);
	const portProvider = new PortProvider(net);
	const gameProvider = new GameProvider(logger, GameDig);
	const grpcProvider = new GrpcProvider(grpc, protoLoader);
	const webSocketProvider = new WebSocketProvider(WebSocket);
	const dnsProvider = new DNSProvider(() => new Resolver());

	const networkService = new NetworkService(axios, logger, [
		pingProvider,
		httpProvider,
		pageSpeedProvider,
		hardwareProvider,
		dockerProvider,
		portProvider,
		gameProvider,
		grpcProvider,
		webSocketProvider,
		dnsProvider,
	]);
	const emailService = new EmailService(settingsService, fs, path, compile, mjml2html, nodemailer, logger);

	const notificationMessageBuilder = new NotificationMessageBuilder();

	const incidentService = new IncidentService(logger, incidentsRepository, monitorsRepository, usersRepository, notificationMessageBuilder);

	const checkService = new CheckService(monitorsRepository, logger, checksRepository);

	const globalPingService = new GlobalPingService(logger);

	const geoChecksService = new GeoChecksService({
		logger,
		geoChecksRepository,
		globalPingService,
		monitorsRepository,
	});

	const bufferService = new BufferService(logger, checkService, geoChecksService, settingsService);

	const statusService = new StatusService(logger, bufferService, monitorsRepository, monitorStatsRepository, checksRepository);

	// Notification providers
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

	const tagsService = new TagsService(tagsRepository, monitorsRepository);

	const monitorStatusPolicy = new MonitorStatusPolicy();
	// reactors and dispatcher
	const notificationReactor = new NotificationReactor(notificationsService);
	const incidentReactor = new IncidentReactor(incidentService);
	const reactorDispatcher = new ReactorDispatcher(logger, [notificationReactor, incidentReactor]);

	// Check producer/evaluator
	const checkProducer = new CheckProducer(monitorsRepository, maintenanceWindowsRepository, checkService, networkService, bufferService, logger);
	const checkEvaluator = new CheckEvaluator(statusService, monitorStatusPolicy);

	// pipelines
	const checkPipeline = new CheckPipeline(checkProducer, checkEvaluator);

	const geoCheckPipeline = new GeoChecksPipeline(maintenanceWindowsRepository, geoChecksService, bufferService, logger);

	const workerHelper = new WorkerHelper(
		logger,
		checkService,
		settingsService,
		monitorsRepository,
		teamsRepository,
		monitorStatsRepository,
		checksRepository,
		incidentsRepository,
		geoChecksRepository,
		reactorDispatcher,
		checkPipeline,
		geoCheckPipeline
	);

	const worker = await DBQueueWorker.create(
		logger,
		jobsRepository,
		monitorsRepository,
		checksRepository,
		checkService,
		checkProducer,
		checkEvaluator,
		geoCheckPipeline,
		reactorDispatcher,
		workerHelper,
		queueWorkersRepository,
		envSettings.queueMode,
		envSettings.queuePrimaryProcesses,
		workerId
	);

	// Business services
	const userService = new UserService({
		crypto,
		emailService,
		settingsService,
		logger,
		jwt,
		worker,
		monitorsRepository,
		usersRepository,
		invitesRepository,
		recoveryTokensRepository,
		settingsRepository,
		teamsRepository,
	});

	const diagnosticService = new DiagnosticService(db);
	const inviteService = new InviteService({
		invitesRepository,
		settingsService,
		emailService,
	});
	const maintenanceWindowService = new MaintenanceWindowService({
		monitorsRepository,
		maintenanceWindowsRepository,
	});
	const monitorService = new MonitorService({
		worker,
		logger,
		games,
		monitorsRepository,
		checksRepository,
		geoChecksRepository,
		monitorStatsRepository,
		statusPagesRepository,
		incidentsRepository,
	});

	const statusPageService = new StatusPageService(statusPagesRepository, settingsService);

	const services = {
		settingsService,
		db,
		networkService,
		emailService,
		bufferService,
		statusService,
		worker,
		userService,
		checkService,
		geoChecksService,
		diagnosticService,
		inviteService,
		maintenanceWindowService,
		monitorService,
		incidentService,
		logger,
		notificationsService,
		tagsService,
		statusPageService,
		notificationMessageBuilder,

		// Repositories
		monitorsRepository,
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
	};

	return services;
};
