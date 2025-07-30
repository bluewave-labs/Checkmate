import ServiceRegistry from "../service/system/serviceRegistry.js";
import TranslationService from "../service/system/translationService.js";
import StringService from "../service/system/stringService.js";
import MongoDB from "../db/mongo/MongoDB.js";
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
import MonitorService from "../service/business/monitorService.js";
import papaparse from "papaparse";
import axios from "axios";
import ping from "ping";
import http from "http";
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

import { fileURLToPath } from "url";
import { ObjectId } from "mongodb";

// DB Modules
import { NormalizeData, NormalizeDataUptimeDetails } from "../utils/dataUtils.js";
import { GenerateAvatarImage } from "../utils/imageProcessing.js";
import { ParseBoolean } from "../utils/utils.js";

// Models
import Check from "../db/models/Check.js";
import HardwareCheck from "../db/models/HardwareCheck.js";
import PageSpeedCheck from "../db/models/PageSpeedCheck.js";
import Monitor from "../db/models/Monitor.js";
import User from "../db/models/User.js";
import InviteToken from "../db/models/InviteToken.js";
import StatusPage from "../db/models/StatusPage.js";
import Team from "../db/models/Team.js";
import MaintenanceWindow from "../db/models/MaintenanceWindow.js";
import MonitorStats from "../db/models/MonitorStats.js";

import InviteModule from "../db/mongo/modules/inviteModule.js";
import CheckModule from "../db/mongo/modules/checkModule.js";
import StatusPageModule from "../db/mongo/modules/statusPageModule.js";
import UserModule from "../db/mongo/modules/userModule.js";
import HardwareCheckModule from "../db/mongo/modules/hardwareCheckModule.js";
import MaintenanceWindowModule from "../db/mongo/modules/maintenanceWindowModule.js";
import MonitorModule from "../db/mongo/modules/monitorModule.js";
export const initializeServices = async ({ logger, envSettings, settingsService }) => {
	const serviceRegistry = new ServiceRegistry({ logger });
	ServiceRegistry.instance = serviceRegistry;

	const translationService = new TranslationService(logger);
	await translationService.initialize();

	const stringService = new StringService(translationService);

	// Create DB
	const checkModule = new CheckModule({ logger, Check, HardwareCheck, PageSpeedCheck, Monitor, User });
	const inviteModule = new InviteModule({ InviteToken, crypto, stringService });
	const statusPageModule = new StatusPageModule({ StatusPage, NormalizeData, stringService });
	const userModule = new UserModule({ User, Team, GenerateAvatarImage, ParseBoolean, stringService });
	const hardwareCheckModule = new HardwareCheckModule({ HardwareCheck, Monitor, logger });
	const maintenanceWindowModule = new MaintenanceWindowModule({ MaintenanceWindow });
	const monitorModule = new MonitorModule({
		Monitor,
		MonitorStats,
		Check,
		PageSpeedCheck,
		HardwareCheck,
		stringService,
		fs,
		path,
		fileURLToPath,
		ObjectId,
		NormalizeData,
		NormalizeDataUptimeDetails,
	});
	const db = new MongoDB({
		logger,
		envSettings,
		checkModule,
		inviteModule,
		statusPageModule,
		userModule,
		hardwareCheckModule,
		maintenanceWindowModule,
		monitorModule,
	});

	await db.connect();

	const networkService = new NetworkService(axios, ping, logger, http, Docker, net, stringService, settingsService);
	const emailService = new EmailService(settingsService, fs, path, compile, mjml2html, nodemailer, logger);
	const bufferService = new BufferService({ db, logger, envSettings });
	const statusService = new StatusService({ db, logger, buffer: bufferService });

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

	const errorService = new ErrorService();

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
	});

	const services = {
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
		errorService,
		logger,
	};

	Object.values(services).forEach((service) => {
		ServiceRegistry.register(service.serviceName, service);
	});

	return services;
};
