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
	MongoIncidentRepository,
	MongoTeamsRepository,
	MongoMaintenanceWindowsRepository,
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
	settingsRepository,
}: {
	logger: ILogger;
	envSettings: EnvConfig;
	settingsService: ISettingsService;
	settingsRepository: ISettingsRepository;
}): Promise<InitializedServices> => {
	// Create DB

	const db = new MongoDB(logger, envSettings);

	await db.connect();

	// Repositories
	const monitorsRepository = new MongoMonitorsRepository();
	const checksRepository = new MongoChecksRepository(logger);
	const geoChecksRepository = new MongoGeoChecksRepository(logger);
	const monitorStatsRepository = new MongoMonitorStatsRepository();
	const statusPagesRepository = new MongoStatusPagesRepository();
	const usersRepository = new MongoUsersRepository();
	const invitesRepository = new MongoInvitesRepository();
	const recoveryTokensRepository = new MongoRecoveryTokensRepository();
	const notificationsRepository = new MongoNotificationsRepository();
	const incidentsRepository = new MongoIncidentRepository();
	const teamsRepository = new MongoTeamsRepository();
	const maintenanceWindowsRepository = new MongoMaintenanceWindowsRepository();

	// Network providers
	const pingProvider = new PingProvider(ping);
	const httpProvider = new HttpProvider(got, new AdvancedMatcher(jmespath));
	const pageSpeedProvider = new PageSpeedProvider(httpProvider, settingsService, logger);
	const hardwareProvider = new HardwareProvider(httpProvider);
	const dockerProvider = new DockerProvider(logger, Docker);
	const portProvider = new PortProvider(net);
	const gameProvider = new GameProvider(logger, GameDig);
	const grpcProvider = new GrpcProvider(grpc, protoLoader);

	const networkService = new NetworkService(axios, logger, [
		pingProvider,
		httpProvider,
		pageSpeedProvider,
		hardwareProvider,
		dockerProvider,
		portProvider,
		gameProvider,
		grpcProvider,
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
		emailService,
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
