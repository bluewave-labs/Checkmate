import ServiceRegistry from "../service/v1/system/serviceRegistry.js";
import TranslationService from "../service/v1/system/translationService.js";
import StringService from "../service/v1/system/stringService.js";
import MongoDB from "../db/v1/MongoDB.js";
import NetworkService from "../service/v1/infrastructure/networkService.js";
import EmailService from "../service/v1/infrastructure/emailService.js";
import BufferService from "../service/v1/infrastructure/bufferService.js";
import StatusService from "../service/v1/infrastructure/statusService.js";
import NotificationUtils from "../service/v1/infrastructure/notificationUtils.js";
import NotificationService from "../service/v1/infrastructure/notificationService.js";
import ErrorService from "../service/v1/infrastructure/errorService.js";
import SuperSimpleQueueHelper from "../service/v1/infrastructure/SuperSimpleQueue/SuperSimpleQueueHelper.js";
import SuperSimpleQueue from "../service/v1/infrastructure/SuperSimpleQueue/SuperSimpleQueue.js";
import UserService from "../service/v1/business/userService.js";
import CheckService from "../service/v1/business/checkService.js";
import DiagnosticService from "../service/v1/business/diagnosticService.js";
import InviteService from "../service/v1/business/inviteService.js";
import MaintenanceWindowService from "../service/v1/business/maintenanceWindowService.js";
import MonitorService from "../service/v1/business/monitorService.js";
import IncidentService from "../service/v1/business/incidentService.js";
import papaparse from "papaparse";
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
import { games } from "gamedig";
import jmespath from "jmespath";
import { GameDig } from "gamedig";

import { fileURLToPath } from "url";
import { ObjectId } from "mongodb";

// DB Modules
import { NormalizeData, NormalizeDataUptimeDetails } from "../utils/dataUtils.js";
import { GenerateAvatarImage } from "../utils/imageProcessing.js";
import { ParseBoolean } from "../utils/utils.js";

// Models
import Check from "../db/v1/models/Check.js";
import Monitor from "../db/v1/models/Monitor.js";
import User from "../db/v1/models/User.js";
import InviteToken from "../db/v1/models/InviteToken.js";
import StatusPage from "../db/v1/models/StatusPage.js";
import Team from "../db/v1/models/Team.js";
import MaintenanceWindow from "../db/v1/models/MaintenanceWindow.js";
import MonitorStats from "../db/v1/models/MonitorStats.js";
import Notification from "../db/v1/models/Notification.js";
import RecoveryToken from "../db/v1/models/RecoveryToken.js";
import AppSettings from "../db/v1/models/AppSettings.js";
import Incident from "../db/v1/models/Incident.js";

import InviteModule from "../db/v1/modules/inviteModule.js";
import CheckModule from "../db/v1/modules/checkModule.js";
import StatusPageModule from "../db/v1/modules/statusPageModule.js";
import UserModule from "../db/v1/modules/userModule.js";
import MaintenanceWindowModule from "../db/v1/modules/maintenanceWindowModule.js";
import MonitorModule from "../db/v1/modules/monitorModule.js";
import NotificationModule from "../db/v1/modules/notificationModule.js";
import RecoveryModule from "../db/v1/modules/recoveryModule.js";
import SettingsModule from "../db/v1/modules/settingsModule.js";
import IncidentModule from "../db/v1/modules/incidentModule.js";

// V2 Business
import AuthServiceV2 from "../service/v2/business/AuthService.js";
import CheckServiceV2 from "../service/v2/business/CheckService.js";
import InviteServiceV2 from "../service/v2/business/InviteService.js";
import MaintenanceServiceV2 from "../service/v2/business/MaintenanceService.js";
import MonitorServiceV2 from "../service/v2/business/MonitorService.js";
import MonitorStatsServiceV2 from "../service/v2/business/MonitorStatsService.js";
import NotificationChannelServiceV2 from "../service/v2/business/NotificationChannelService.js";
import QueueServiceV2 from "../service/v2/business/QueueService.js";
import UserServiceV2 from "../service/v2/business/UserService.js";

// V2 Infra
import DiscordServiceV2 from "../service/v2/infrastructure/NotificationServices/Discord.js";
import EmailServiceV2 from "../service/v2/infrastructure/NotificationServices/Email.js";
import SlackServiceV2 from "../service/v2/infrastructure/NotificationServices/Slack.js";
import WebhookServiceV2 from "../service/v2/infrastructure/NotificationServices/Webhook.js";
import JobGeneratorV2 from "../service/v2/infrastructure/JobGenerator.js";
import JobQueueV2 from "../service/v2/infrastructure/JobQueue.js";
import NetworkServiceV2 from "../service/v2/infrastructure/NetworkService.js";
import NotificationServiceV2 from "../service/v2/infrastructure/NotificationService.js";
import StatusServiceV2 from "../service/v2/infrastructure/StatusService.js";

export const initializeServices = async ({ logger, envSettings, settingsService }) => {
	const serviceRegistry = new ServiceRegistry({ logger });
	ServiceRegistry.instance = serviceRegistry;

	const translationService = new TranslationService(logger);
	await translationService.initialize();

	const stringService = new StringService(translationService);

	// Create DB
	const checkModule = new CheckModule({ logger, Check, Monitor, User });
	const inviteModule = new InviteModule({ InviteToken, crypto, stringService });
	const statusPageModule = new StatusPageModule({ StatusPage, NormalizeData, stringService });
	const userModule = new UserModule({ User, Team, GenerateAvatarImage, ParseBoolean, stringService });
	const maintenanceWindowModule = new MaintenanceWindowModule({ MaintenanceWindow });
	const monitorModule = new MonitorModule({
		Monitor,
		MonitorStats,
		Check,
		stringService,
		fs,
		path,
		fileURLToPath,
		ObjectId,
		NormalizeData,
		NormalizeDataUptimeDetails,
	});
	const notificationModule = new NotificationModule({ Notification, Monitor });
	const recoveryModule = new RecoveryModule({ User, RecoveryToken, crypto, stringService });
	const settingsModule = new SettingsModule({ AppSettings });
	const incidentModule = new IncidentModule({ logger, Incident, Monitor, User });

	const db = new MongoDB({
		logger,
		envSettings,
		checkModule,
		inviteModule,
		statusPageModule,
		userModule,
		maintenanceWindowModule,
		monitorModule,
		notificationModule,
		recoveryModule,
		settingsModule,
		incidentModule,
	});

	await db.connect();

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
		stringService,
		settingsService,
	});
	const emailService = new EmailService(settingsService, fs, path, compile, mjml2html, nodemailer, logger);
	const errorService = new ErrorService();

	const incidentService = new IncidentService({
		db,
		logger,
		errorService,
		stringService,
	});

	const bufferService = new BufferService({ db, logger, envSettings, incidentService });

	const statusService = new StatusService({ db, logger, buffer: bufferService, incidentService });

	const notificationUtils = new NotificationUtils({
		stringService,
		emailService,
	});

	const notificationService = new NotificationService({
		emailService,
		db,
		logger,
		networkService,
		stringService,
		notificationUtils,
	});

	const superSimpleQueueHelper = new SuperSimpleQueueHelper({
		db,
		logger,
		networkService,
		statusService,
		notificationService,
	});

	const superSimpleQueue = await SuperSimpleQueue.create({
		envSettings,
		db,
		logger,
		helper: superSimpleQueueHelper,
	});

	// Business services
	const userService = new UserService({
		crypto,
		db,
		emailService,
		settingsService,
		logger,
		stringService,
		jwt,
		errorService,
		jobQueue: superSimpleQueue,
	});
	const checkService = new CheckService({
		db,
		settingsService,
		stringService,
		errorService,
	});
	const diagnosticService = new DiagnosticService();
	const inviteService = new InviteService({
		db,
		settingsService,
		emailService,
		stringService,
		errorService,
	});
	const maintenanceWindowService = new MaintenanceWindowService({
		db,
		settingsService,
		stringService,
		errorService,
	});
	const monitorService = new MonitorService({
		db,
		settingsService,
		jobQueue: superSimpleQueue,
		stringService,
		emailService,
		papaparse,
		logger,
		errorService,
		games,
	});

	// V2 Services
	const checkServiceV2 = new CheckServiceV2();
	const inviteServiceV2 = new InviteServiceV2();
	const maintenanceServiceV2 = new MaintenanceServiceV2();
	const monitorStatsServiceV2 = new MonitorStatsServiceV2();
	const notificationChannelServiceV2 = new NotificationChannelServiceV2();
	const userServiceV2 = new UserServiceV2();
	const discordServiceV2 = new DiscordServiceV2();
	const emailServiceV2 = new EmailServiceV2(userServiceV2);
	const slackServiceV2 = new SlackServiceV2();
	const webhookServiceV2 = new WebhookServiceV2();
	const networkServiceV2 = new NetworkServiceV2();
	const statusServiceV2 = new StatusServiceV2();
	const notificationServiceV2 = new NotificationServiceV2(userServiceV2);
	const jobGeneratorV2 = new JobGeneratorV2(
		networkServiceV2,
		checkServiceV2,
		monitorStatsServiceV2,
		statusServiceV2,
		notificationServiceV2,
		maintenanceServiceV2
	);
	const jobQueueV2 = await JobQueueV2.create(jobGeneratorV2);
	const authServiceV2 = new AuthServiceV2(jobQueueV2);
	const monitorServiceV2 = new MonitorServiceV2(jobQueueV2);
	const queueServiceV2 = new QueueServiceV2(jobQueueV2);

	const services = {
		//v1
		settingsService,
		translationService,
		stringService,
		db,
		networkService,
		emailService,
		bufferService,
		statusService,
		notificationService,
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
		//v2
		jobQueueV2,
		authServiceV2,
		checkServiceV2,
		inviteServiceV2,
		maintenanceServiceV2,
		monitorServiceV2,
		monitorStatsServiceV2,
		notificationChannelServiceV2,
		queueServiceV2,
		userServiceV2,
		discordServiceV2,
		emailServiceV2,
		slackServiceV2,
		webhookServiceV2,
		networkServiceV2,
		statusServiceV2,
		notificationServiceV2,
		jobGeneratorV2,
	};

	Object.values(services).forEach((service) => {
		ServiceRegistry.register(service.serviceName, service);
	});

	return services;
};
