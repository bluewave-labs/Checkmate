import ServiceRegistry from "../service/v1/system/serviceRegistry.js";
import TranslationService from "../service/v1/system/translationService.js";
import StringService from "../service/v1/system/stringService.js";
import MongoDB from "../db/v1/MongoDB.js";
import NetworkService from "../service/v1/infrastructure/networkService.js";
import EmailService from "../service/v1/infrastructure/emailService.js";
import TwilioService from "../service/v1/infrastructure/twilioService.js";
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
	const twilioService = new TwilioService(settingsService, logger);
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
		settingsService,
	});

	const notificationService = new NotificationService({
		emailService,
		db,
		logger,
		networkService,
		stringService,
		notificationUtils,
		twilioService,
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
	};

	Object.values(services).forEach((service) => {
		ServiceRegistry.register(service.serviceName, service);
	});

	return services;
};
