import MongoDB from "../db/MongoDB.js";
import NetworkService from "../service/infrastructure/networkService.js";
import EmailService from "../service/infrastructure/emailService.js";
import BufferService from "../service/infrastructure/bufferService.js";
import {
	NotificationsService,
	StatusService,
	WebhookProvider,
	SlackProvider,
	EmailProvider,
	DiscordProvider,
	PagerDutyProvider,
	MatrixProvider,
	INotificationsService,
} from "@/service/index.js";
import SuperSimpleQueueHelper from "../service/infrastructure/SuperSimpleQueue/SuperSimpleQueueHelper.js";
import SuperSimpleQueue from "../service/infrastructure/SuperSimpleQueue/SuperSimpleQueue.js";
import UserService from "../service/business/userService.js";
import CheckService from "../service/business/checkService.js";
import GeoChecksService from "../service/business/geoChecksService.js";
import GlobalPingService from "../service/infrastructure/globalPingService.js";
import DiagnosticService from "../service/business/diagnosticService.js";
import InviteService from "../service/business/inviteService.js";
import MaintenanceWindowService from "../service/business/maintenanceWindowService.js";
import { MonitorService } from "@/service/index.js";
import { StatusPageService, IStatusPageService } from "../service/business/statusPageService.js";
import IncidentService from "../service/business/incidentService.js";
import { NotificationMessageBuilder, INotificationMessageBuilder } from "../service/infrastructure/notificationMessageBuilder.js";
import axios from "axios";
import got from "got";
import ping from "ping";
import https from "https";
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

// repositories
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
import { EnvConfig } from "@/service/system/settingsService.js";
import { PingProvider } from "@/service/infrastructure/network/PingProvider.js";
import { HttpProvider } from "@/service/infrastructure/network/HttpProvider.js";
import { AdvancedMatcher } from "@/service/infrastructure/network/AdvancedMatcher.js";

export type InitializedServices = {
	settingsService: any;
	db: any;
	networkService: any;
	emailService: any;
	bufferService: any;
	statusService: any;
	jobQueue: any;
	userService: any;
	checkService: any;
	geoChecksService: any;
	diagnosticService: any;
	inviteService: any;
	maintenanceWindowService: any;
	monitorService: any;
	incidentService: any;
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
	settingsService: any;
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

	// Providers

	const pingProvider = new PingProvider(ping);
	const httpProvider = new HttpProvider(got, new AdvancedMatcher(jmespath));

	const networkService = new NetworkService(
		axios,
		got,
		https,
		jmespath,
		GameDig as unknown as {
			query: (options: { type: string; host: string; port?: number }) => Promise<{ ping?: number } & { [key: string]: unknown }>;
		},
		ping,
		logger,
		Docker,
		net,
		settingsService,
		grpc,
		protoLoader,
		pingProvider,
		httpProvider
	);
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

	const webhookProvider = new WebhookProvider(logger);
	const slackProvider = new SlackProvider(logger);
	const emailProvider = new EmailProvider(emailService, logger);
	const discordProvider = new DiscordProvider(logger);
	const pagerDutyProvider = new PagerDutyProvider(logger);
	const matrixProvider = new MatrixProvider(logger);

	const notificationsService = new NotificationsService(
		notificationsRepository,
		monitorsRepository,
		webhookProvider,
		emailProvider,
		slackProvider,
		discordProvider,
		pagerDutyProvider,
		matrixProvider,
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
		//v1
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
