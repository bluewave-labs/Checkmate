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
import ErrorService from "../service/infrastructure/errorService.js";
import SuperSimpleQueueHelper from "../service/infrastructure/SuperSimpleQueue/SuperSimpleQueueHelper.js";
import SuperSimpleQueue from "../service/infrastructure/SuperSimpleQueue/SuperSimpleQueue.js";
import UserService from "../service/business/userService.js";
import CheckService from "../service/business/checkService.js";
import DiagnosticService from "../service/business/diagnosticService.js";
import InviteService from "../service/business/inviteService.js";
import MaintenanceWindowService from "../service/business/maintenanceWindowService.js";
import { MonitorService } from "@/service/index.js";
import IncidentService from "../service/business/incidentService.js";
import axios from "axios";
import got from "got";
import ping from "ping";
import http from "http";
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

// DB Modules
import { NormalizeData } from "../utils/dataUtils.js";
import { GenerateAvatarImage } from "../utils/imageProcessing.js";
import { ParseBoolean } from "../utils/utils.js";

// Models
import Monitor from "../db/models/Monitor.js";
import User from "../db/models/User.js";
import InviteToken from "../db/models/Invite.js";
import StatusPage from "../db/models/StatusPage.js";
import Team from "../db/models/Team.js";
import MaintenanceWindow from "../db/models/MaintenanceWindow.js";
import MonitorStats from "../db/models/MonitorStats.js";
import NotificationModel from "../db/models/Notification.js";
import RecoveryToken from "../db/models/RecoveryToken.js";
import AppSettings from "../db/models/AppSettings.js";
import Incident from "../db/models/Incident.js";

import InviteModule from "../db/modules/inviteModule.js";
import StatusPageModule from "../db/modules/statusPageModule.js";
import UserModule from "../db/modules/userModule.js";
import MaintenanceWindowModule from "../db/modules/maintenanceWindowModule.js";
import NotificationModule from "../db/modules/notificationModule.js";
import RecoveryModule from "../db/modules/recoveryModule.js";
import SettingsModule from "../db/modules/settingsModule.js";
import IncidentModule from "../db/modules/incidentModule.js";

// repositories
import {
	MongoMonitorsRepository,
	MongoChecksRepository,
	MongoMonitorStatsRepository,
	MongoStatusPagesRepository,
	MongoUsersRepository,
	MongoInvitesRepository,
	MongoRecoveryTokensRepository,
	MongoSettingsRepository,
	MongoNotificationsRepository,
	MongoIncidentRepository,
	IMonitorsRepository,
	IChecksRepository,
	IMonitorStatsRepository,
	IStatusPagesRepository,
	IUsersRepository,
	IInvitesRepository,
	IRecoveryTokensRepository,
	ISettingsRepository,
	INotificationsRepository,
	IIncidentsRepository,
} from "@/repositories/index.js";
import { ILogger } from "@/utils/logger.js";
import { EnvConfig } from "@/service/system/settingsService.js";

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
	diagnosticService: any;
	inviteService: any;
	maintenanceWindowService: any;
	monitorService: any;
	incidentService: any;
	errorService: any;
	logger: any;
	notificationsService: INotificationsService;

	// Repositories
	monitorsRepository: IMonitorsRepository;
	checksRepository: IChecksRepository;
	monitorStatsRepository: IMonitorStatsRepository;
	statusPagesRepository: IStatusPagesRepository;
	usersRepository: IUsersRepository;
	invitesRepository: IInvitesRepository;
	recoveryTokensRepository: IRecoveryTokensRepository;
	settingsRepository: ISettingsRepository;
	notificationsRepository: INotificationsRepository;
	incidentsRepository: IIncidentsRepository;
};

export const initializeServices = async ({
	logger,
	envSettings,
	settingsService,
}: {
	logger: ILogger;
	envSettings: EnvConfig;
	settingsService: any;
}): Promise<InitializedServices> => {
	// Create DB
	const inviteModule = new InviteModule({ InviteToken, crypto });
	const statusPageModule = new StatusPageModule({ StatusPage, NormalizeData, AppSettings });
	const userModule = new UserModule({ User, Team, GenerateAvatarImage, ParseBoolean });
	const maintenanceWindowModule = new MaintenanceWindowModule({ MaintenanceWindow });
	const notificationModule = new NotificationModule({ Notification: NotificationModel, Monitor });
	const recoveryModule = new RecoveryModule({ User, RecoveryToken, crypto });
	const settingsModule = new SettingsModule({ AppSettings });
	const incidentModule = new IncidentModule({ logger, Incident, Monitor, User });

	const db = new MongoDB({
		logger,
		envSettings,
		inviteModule,
		statusPageModule,
		userModule,
		maintenanceWindowModule,
		notificationModule,
		recoveryModule,
		settingsModule,
		incidentModule,
	});

	await db.connect();

	// Repositories
	const monitorsRepository = new MongoMonitorsRepository();
	const checksRepository = new MongoChecksRepository(logger);
	const monitorStatsRepository = new MongoMonitorStatsRepository();
	const statusPagesRepository = new MongoStatusPagesRepository();
	const usersRepository = new MongoUsersRepository();
	const invitesRepository = new MongoInvitesRepository();
	const recoveryTokensRepository = new MongoRecoveryTokensRepository();
	const settingsRepository = new MongoSettingsRepository();
	const notificationsRepository = new MongoNotificationsRepository();
	const incidentsRepository = new MongoIncidentRepository();
	const networkService = new NetworkService({
		axios,
		got,
		https,
		jmespath,
		GameDig,
		ping,
		logger,
		http,
		Docker,
		net,
		settingsService,
	});
	const emailService = new EmailService(settingsService, fs, path, compile, mjml2html, nodemailer, logger);
	const errorService = new ErrorService();

	const incidentService = new IncidentService({
		db,
		logger,
		errorService,
		incidentsRepository,
	});

	const checkService = new CheckService({
		errorService,
		monitorsRepository,
		logger,
		checksRepository,
	});

	const bufferService = new BufferService({ logger, checkService, settingsService });

	const statusService = new StatusService({ db, logger, buffer: bufferService, monitorsRepository });

	const webhookProvider = new WebhookProvider(logger);
	const slackProvider = new SlackProvider(logger);
	const emailProvider = new EmailProvider(emailService, logger);
	const discordProvider = new DiscordProvider(logger);
	const pagerDutyProvider = new PagerDutyProvider(logger);
	const matrixProvider = new MatrixProvider(logger);

	const notificationsService = new NotificationsService(
		notificationsRepository,
		webhookProvider,
		emailProvider,
		slackProvider,
		discordProvider,
		pagerDutyProvider,
		matrixProvider,
		logger
	);

	const superSimpleQueueHelper = new SuperSimpleQueueHelper({
		db,
		logger,
		networkService,
		statusService,
		notificationsService,
		checkService,
		buffer: bufferService,
		incidentService,
	});

	const superSimpleQueue = await SuperSimpleQueue.create({
		logger,
		helper: superSimpleQueueHelper,
		monitorsRepository,
	});

	// Business services
	const userService = new UserService({
		crypto,
		emailService,
		settingsService,
		logger,
		jwt,
		errorService,
		jobQueue: superSimpleQueue,
		monitorsRepository,
		usersRepository,
		invitesRepository,
		recoveryTokensRepository,
		settingsRepository,
	});

	const diagnosticService = new DiagnosticService();
	const inviteService = new InviteService({
		invitesRepository,
		settingsService,
		emailService,
		errorService,
	});
	const maintenanceWindowService = new MaintenanceWindowService({
		db,
		errorService,
		monitorsRepository,
	});
	const monitorService = new MonitorService({
		jobQueue: superSimpleQueue,
		emailService,
		logger,
		errorService,
		games,
		monitorsRepository,
		checksRepository,
		monitorStatsRepository,
		statusPagesRepository,
	});

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
		diagnosticService,
		inviteService,
		maintenanceWindowService,
		monitorService,
		incidentService,
		errorService,
		logger,
		notificationsService,

		// Repositories
		monitorsRepository,
		checksRepository,
		monitorStatsRepository,
		statusPagesRepository,
		usersRepository,
		invitesRepository,
		recoveryTokensRepository,
		settingsRepository,
		notificationsRepository,
		incidentsRepository,
	};

	return services;
};
