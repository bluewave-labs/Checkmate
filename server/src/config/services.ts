import MongoDB from "../db/MongoDB.js";
import { IDb } from "@/db/IDb.js";
import {
	// Service classes
	NetworkService,
	EmailService,
	BufferService,
	GlobalPingService,
	SuperSimpleQueue,
	SuperSimpleQueueHelper,
	NotificationsService,
	StatusService,
	NotificationMessageBuilder,
	MonitorService,
	StatusPageService,
	UserService,
	CheckService,
	GeoChecksService,
	DiagnosticService,
	InviteService,
	MaintenanceWindowService,
	IncidentService,
	// Notification providers
	WebhookProvider,
	SlackProvider,
	EmailProvider,
	DiscordProvider,
	PagerDutyProvider,
	MatrixProvider,
	TeamsProvider,
	TelegramProvider,
<<<<<<< HEAD
	PushoverProvider,
=======
	NtfyProvider,
>>>>>>> 45c14ac5c (feat: wire ntfy to backend notificationsService)
	// Interfaces
	INetworkService,
	IEmailService,
	IBufferService,
	ISuperSimpleQueue,
	INotificationsService,
	IStatusService,
	IMonitorService,
	IUserService,
	ICheckService,
	IGeoChecksService,
	IDiagnosticService,
	IInviteService,
	IMaintenanceWindowService,
	IStatusPageService,
	IIncidentService,
	INotificationMessageBuilder,
	ISettingsService,
	SettingsService,
	EnvConfig,
} from "@/service/index.js";

// Network providers
import { PingProvider } from "@/service/infrastructure/network/PingProvider.js";
import { HttpProvider } from "@/service/infrastructure/network/HttpProvider.js";
import { AdvancedMatcher } from "@/service/infrastructure/network/AdvancedMatcher.js";
import { PageSpeedProvider } from "@/service/infrastructure/network/PageSpeedProvider.js";
import { HardwareProvider } from "@/service/infrastructure/network/HardwareProvider.js";
import { DockerProvider } from "@/service/infrastructure/network/DockerProvider.js";
import { PortProvider } from "@/service/infrastructure/network/PortProvider.js";
import { GameProvider } from "@/service/infrastructure/network/GameProvider.js";
import { GrpcProvider } from "@/service/infrastructure/network/GrpcProvider.js";
import { WebSocketProvider } from "@/service/infrastructure/network/WebSocketProvider.js";

// Third-party
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
import {
	MongoMonitorsRepository,
	MongoChecksRepository,
	MongoGeoChecksRepository,
	MongoMonitorStatsRepository,
	MongoStatusPagesRepository,
	MongoUsersRepository,
	MongoInvitesRepository,
	MongoRecoveryTokensRepository,
	MongoNotificationsRepository,
	MongoIncidentsRepository,
	MongoTeamsRepository,
	MongoMaintenanceWindowsRepository,
	MongoSettingsRepository,
	TimescaleMonitorsRepository,
	TimescaleChecksRepository,
	TimescaleGeoChecksRepository,
	TimescaleMonitorStatsRepository,
	TimescaleStatusPagesRepository,
	TimescaleUsersRepository,
	TimescaleInvitesRepository,
	TimescaleRecoveryTokensRepository,
	TimescaleNotificationsRepository,
	TimescaleIncidentsRepository,
	TimescaleTeamsRepository,
	TimescaleMaintenanceWindowsRepository,
	TimescaleSettingsRepository,
	IMonitorsRepository,
	IChecksRepository,
	IGeoChecksRepository,
	IMonitorStatsRepository,
	IStatusPagesRepository,
	IUsersRepository,
	IInvitesRepository,
	IRecoveryTokensRepository,
	ISettingsRepository,
	INotificationsRepository,
	IIncidentsRepository,
	ITeamsRepository,
	IMaintenanceWindowsRepository,
} from "@/repositories/index.js";
import { ILogger } from "@/utils/logger.js";
import TimescaleDB from "@/db/TimescaleDB.js";
import { AppError } from "@/utils/AppError.js";

export type InitializedServices = {
	settingsService: ISettingsService;
	db: IDb;
	networkService: INetworkService;
	emailService: IEmailService;
	bufferService: IBufferService;
	statusService: IStatusService;
	jobQueue: ISuperSimpleQueue;
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

	const dbType = envSettings.dbType;

	let db: IDb | null = null;

	if (dbType === "mongodb") {
		db = new MongoDB(logger, envSettings);
	} else if (dbType === "timescaledb") {
		db = new TimescaleDB(logger, envSettings);
	}

	if (!db) {
		throw new AppError({ message: "Unsupported database type", status: 500 });
	}

	await db.connect();

	let monitorsRepository: IMonitorsRepository;
	let checksRepository: IChecksRepository;
	let geoChecksRepository: IGeoChecksRepository;
	let monitorStatsRepository: IMonitorStatsRepository;
	let statusPagesRepository: IStatusPagesRepository;
	let usersRepository: IUsersRepository;
	let invitesRepository: IInvitesRepository;
	let recoveryTokensRepository: IRecoveryTokensRepository;
	let settingsRepository: ISettingsRepository;
	let notificationsRepository: INotificationsRepository;
	let incidentsRepository: IIncidentsRepository;
	let teamsRepository: ITeamsRepository;
	let maintenanceWindowsRepository: IMaintenanceWindowsRepository;

	// Repositories

	if (dbType === "mongodb") {
		monitorsRepository = new MongoMonitorsRepository();
		checksRepository = new MongoChecksRepository(logger);
		geoChecksRepository = new MongoGeoChecksRepository(logger);
		monitorStatsRepository = new MongoMonitorStatsRepository();
		statusPagesRepository = new MongoStatusPagesRepository();
		usersRepository = new MongoUsersRepository();
		invitesRepository = new MongoInvitesRepository();
		recoveryTokensRepository = new MongoRecoveryTokensRepository();
		settingsRepository = new MongoSettingsRepository();
		notificationsRepository = new MongoNotificationsRepository();
		incidentsRepository = new MongoIncidentsRepository();
		teamsRepository = new MongoTeamsRepository();
		maintenanceWindowsRepository = new MongoMaintenanceWindowsRepository();
	} else {
		const pool = db.getPool();
		if (!pool) {
			throw new Error("Failed to get database pool");
		}
		monitorsRepository = new TimescaleMonitorsRepository(pool);
		checksRepository = new TimescaleChecksRepository(pool);
		geoChecksRepository = new TimescaleGeoChecksRepository(pool);
		monitorStatsRepository = new TimescaleMonitorStatsRepository(pool);
		statusPagesRepository = new TimescaleStatusPagesRepository(pool);
		usersRepository = new TimescaleUsersRepository(pool);
		invitesRepository = new TimescaleInvitesRepository(pool);
		recoveryTokensRepository = new TimescaleRecoveryTokensRepository(pool);
		settingsRepository = new TimescaleSettingsRepository(pool);
		notificationsRepository = new TimescaleNotificationsRepository(pool);
		incidentsRepository = new TimescaleIncidentsRepository(pool);
		teamsRepository = new TimescaleTeamsRepository(pool);
		maintenanceWindowsRepository = new TimescaleMaintenanceWindowsRepository(pool);
	}

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
<<<<<<< HEAD
	const pushoverProvider = new PushoverProvider(logger);
=======
	const ntfyProvider = new NtfyProvider(logger);
>>>>>>> 45c14ac5c (feat: wire ntfy to backend notificationsService)

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
<<<<<<< HEAD
		pushoverProvider,
=======
		ntfyProvider,
>>>>>>> 45c14ac5c (feat: wire ntfy to backend notificationsService)
		settingsService,
		logger,
		notificationMessageBuilder
	);

	const superSimpleQueueHelper = new SuperSimpleQueueHelper(
		logger,
		networkService,
		statusService,
		notificationsService,
		checkService,
		settingsService,
		bufferService,
		incidentService,
		maintenanceWindowsRepository,
		monitorsRepository,
		teamsRepository,
		monitorStatsRepository,
		checksRepository,
		incidentsRepository,
		geoChecksService,
		geoChecksRepository
	);

	const superSimpleQueue = await SuperSimpleQueue.create(logger, superSimpleQueueHelper, monitorsRepository);

	// Business services
	const userService = new UserService({
		crypto,
		emailService,
		settingsService,
		logger,
		jwt,
		jobQueue: superSimpleQueue,
		monitorsRepository,
		usersRepository,
		invitesRepository,
		recoveryTokensRepository,
		settingsRepository,
		teamsRepository,
	});

	const diagnosticService = new DiagnosticService();
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
		jobQueue: superSimpleQueue,
		logger,
		games,
		monitorsRepository,
		checksRepository,
		geoChecksRepository,
		monitorStatsRepository,
		statusPagesRepository,
		incidentsRepository,
	});

	const statusPageService = new StatusPageService(statusPagesRepository);

	const services = {
		settingsService,
		db,
		networkService,
		emailService,
		bufferService,
		statusService,
		jobQueue: superSimpleQueue,
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
		incidentsRepository,
		teamsRepository,
		maintenanceWindowsRepository,
	};

	return services;
};
