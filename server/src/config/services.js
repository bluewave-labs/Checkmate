import ServiceRegistry from "../service/system/serviceRegistry.js";
import logger from "../utils/logger.js";
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

export const initializeServices = async (envSettings, settingsService) => {
	const translationService = new TranslationService(logger);
	await translationService.initialize();

	const stringService = new StringService(translationService);

	// Create DB
	const db = new MongoDB({ envSettings });
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
