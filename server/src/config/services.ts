import ServiceRegistry from "../service/system/serviceRegistry.js";
import TranslationService from "../service/system/translationService.js";
import StringService from "../service/system/stringService.js";
import MongoDB from "../db/MongoDB.js";
import NetworkService from "../service/infrastructure/networkService.js";
import EmailService from "../service/infrastructure/emailService.js";
import BufferService from "../service/infrastructure/bufferService.js";
import StatusService from "../service/infrastructure/statusService.js";
import NotificationUtils from "../service/infrastructure/notificationUtils.js";
import NotificationService from "../service/infrastructure/notificationService.js";
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
import { games, GameDig } from "gamedig";
import jmespath from "jmespath";

// DB Modules
import { NormalizeData, NormalizeDataUptimeDetails } from "../utils/dataUtils.js";
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
import Notification from "../db/models/Notification.js";
import RecoveryToken from "../db/models/RecoveryToken.js";
import AppSettings from "../db/models/AppSettings.js";
import Incident from "../db/models/Incident.js";

import InviteModule from "../db/modules/inviteModule.js";
import CheckModule from "../db/modules/checkModule.js";
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
	IMonitorsRepository,
	IChecksRepository,
	IMonitorStatsRepository,
	IStatusPagesRepository,
	IUsersRepository,
	IInvitesRepository,
	IRecoveryTokensRepository,
} from "@/repositories/index.js";

export type InitializedSerivces = {
	//v1
	settingsService: any;
	translationService: any;
	stringService: any;
	db: any;
	networkService: any;
	emailService: any;
	bufferService: any;
	statusService: any;
	notificationService: any;
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

	// Repositories
	monitorsRepository: IMonitorsRepository;
	checksRepository: IChecksRepository;
	monitorStatsRepository: IMonitorStatsRepository;
	statusPagesRepository: IStatusPagesRepository;
	usersRepository: IUsersRepository;
	invitesRepository: IInvitesRepository;
	recoveryTokensRepository: IRecoveryTokensRepository;
};

export const initializeServices = async ({
	logger,
	envSettings,
	settingsService,
}: {
	logger: any;
	envSettings: any;
	settingsService: any;
}): Promise<InitializedSerivces> => {
	const serviceRegistry = new ServiceRegistry({ logger });
	(ServiceRegistry as any).instance = serviceRegistry;

	const translationService = new TranslationService(logger);
	await translationService.initialize();

	const stringService = new StringService(translationService);

	// Create DB
	const checkModule = new CheckModule({ logger, Monitor, User });
	const inviteModule = new InviteModule({ InviteToken, crypto, stringService });
	const statusPageModule = new StatusPageModule({ StatusPage, NormalizeData, stringService, AppSettings });
	const userModule = new UserModule({ User, Team, GenerateAvatarImage, ParseBoolean, stringService });
	const maintenanceWindowModule = new MaintenanceWindowModule({ MaintenanceWindow });
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

	const checkService = new CheckService({
		db,
		settingsService,
		stringService,
		errorService,
		monitorsRepository,
		logger,
		checksRepository,
	});

	const bufferService = new BufferService({ db, logger, envSettings, incidentService, checkService });

	const statusService = new StatusService({ db, logger, buffer: bufferService, incidentService, monitorsRepository });

	const notificationUtils = new NotificationUtils({
		stringService,
		emailService,
		settingsService,
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
		checkService,
		buffer: bufferService,
	});

	const superSimpleQueue = await SuperSimpleQueue.create({
		logger,
		helper: superSimpleQueueHelper,
		monitorsRepository,
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
		monitorsRepository,
		usersRepository,
		invitesRepository,
		recoveryTokensRepository,
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
		monitorsRepository,
	});
	const monitorService = new MonitorService({
		jobQueue: superSimpleQueue,
		stringService,
		emailService,
		papaparse,
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

		// Repositories
		monitorsRepository,
		checksRepository,
		monitorStatsRepository,
		statusPagesRepository,
		usersRepository,
		invitesRepository,
		recoveryTokensRepository,
	};

	Object.values(services).forEach((service) => {
		ServiceRegistry.register(service.serviceName, service);
	});

	return services;
};
