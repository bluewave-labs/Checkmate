import path from "path";
import fs from "fs";
import swaggerUi from "swagger-ui-express";

import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import logger from "./utils/logger.js";
import { verifyJWT } from "./middleware/verifyJWT.js";
import { handleErrors } from "./middleware/handleErrors.js";
import { responseHandler } from "./middleware/responseHandler.js";
import { fileURLToPath } from "url";

import AuthRoutes from "./routes/authRoute.js";
import AuthController from "./controllers/authController.js";

import InviteRoutes from "./routes/inviteRoute.js";
import InviteController from "./controllers/inviteController.js";

import MonitorRoutes from "./routes/monitorRoute.js";
import MonitorController from "./controllers/monitorController.js";

import CheckRoutes from "./routes/checkRoute.js";
import CheckController from "./controllers/checkController.js";

import MaintenanceWindowRoutes from "./routes/maintenanceWindowRoute.js";
import MaintenanceWindowController from "./controllers/maintenanceWindowController.js";

import SettingsRoutes from "./routes/settingsRoute.js";
import SettingsController from "./controllers/settingsController.js";

import StatusPageRoutes from "./routes/statusPageRoute.js";
import StatusPageController from "./controllers/statusPageController.js";

import QueueRoutes from "./routes/queueRoute.js";
import QueueController from "./controllers/queueController.js";

import LogRoutes from "./routes/logRoutes.js";
import LogController from "./controllers/logController.js";

import NotificationRoutes from "./routes/notificationRoute.js";
import NotificationController from "./controllers/notificationController.js";

import DiagnosticRoutes from "./routes/diagnosticRoute.js";
import DiagnosticController from "./controllers/diagnosticController.js";

//JobQueue service and dependencies
import JobQueue from "./service/JobQueue/JobQueue.js";
import JobQueueHelper from "./service/JobQueue/JobQueueHelper.js";
import { Queue, Worker } from "bullmq";

import PulseQueue from "./service/PulseQueue/PulseQueue.js";
import PulseQueueHelper from "./service/PulseQueue/PulseQueueHelper.js";

//Network service and dependencies
import NetworkService from "./service/networkService.js";
import axios from "axios";
import ping from "ping";
import http from "http";
import Docker from "dockerode";
import net from "net";
// Email service and dependencies
import EmailService from "./service/emailService.js";
import nodemailer from "nodemailer";
import pkg from "handlebars";
const { compile } = pkg;
import mjml2html from "mjml";

// Settings Service and dependencies
import SettingsService from "./service/settingsService.js";
import AppSettings from "./db/models/AppSettings.js";

// Status Service and dependencies
import StatusService from "./service/statusService.js";

// Notification Service and dependencies
import NotificationService from "./service/notificationService.js";
import NotificationUtils from "./service/notificationUtils.js";

// Buffer Service and dependencies
import BufferService from "./service/bufferService.js";

// Service Registry
import ServiceRegistry from "./service/serviceRegistry.js";

import MongoDB from "./db/mongo/MongoDB.js";

// Redis Service and dependencies
import IORedis from "ioredis";
import RedisService from "./service/redisService.js";

import TranslationService from "./service/translationService.js";
import languageMiddleware from "./middleware/languageMiddleware.js";
import StringService from "./service/stringService.js";

const SERVICE_NAME = "Server";
const SHUTDOWN_TIMEOUT = 1000;
let isShuttingDown = false;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const openApiSpec = JSON.parse(
	fs.readFileSync(path.join(__dirname, "openapi.json"), "utf8")
);

const frontendPath = path.join(__dirname, "public");

let server;

const shutdown = async () => {
	if (isShuttingDown) {
		return;
	}
	isShuttingDown = true;
	logger.info({ message: "Attempting graceful shutdown" });
	setTimeout(async () => {
		logger.error({
			message: "Could not shut down in time, forcing shutdown",
			service: SERVICE_NAME,
			method: "shutdown",
		});
		await ServiceRegistry.get(RedisService.SERVICE_NAME).flushRedis();
		process.exit(1);
	}, SHUTDOWN_TIMEOUT);
	try {
		server.close();
		await ServiceRegistry.get(JobQueue.SERVICE_NAME).shutdown();
		await ServiceRegistry.get(MongoDB.SERVICE_NAME).disconnect();
		logger.info({ message: "Graceful shutdown complete" });
		process.exit(0);
	} catch (error) {
		logger.error({
			message: error.message,
			service: SERVICE_NAME,
			method: "shutdown",
			stack: error.stack,
		});
	}
};
// Need to wrap server setup in a function to handle async nature of JobQueue
const startApp = async () => {
	const app = express();
	// Create and Register Primary services
	const translationService = new TranslationService(logger);
	const stringService = new StringService(translationService);
	ServiceRegistry.register(StringService.SERVICE_NAME, stringService);

	// Create services
	const settingsService = new SettingsService(AppSettings);
	const appSettings = settingsService.loadSettings();

	// Create DB
	const db = new MongoDB({ appSettings });
	await db.connect();

	// Set allowed origin
	const allowedOrigin = appSettings.clientHost;

	const networkService = new NetworkService(
		axios,
		ping,
		logger,
		http,
		Docker,
		net,
		stringService,
		settingsService
	);
	const emailService = new EmailService(
		settingsService,
		fs,
		path,
		compile,
		mjml2html,
		nodemailer,
		logger
	);
	const bufferService = new BufferService({ db, logger });
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

	const redisService = new RedisService({ Redis: IORedis, logger });

	// const jobQueueHelper = new JobQueueHelper({
	// 	redisService,
	// 	Queue,
	// 	Worker,
	// 	logger,
	// 	db,
	// 	networkService,
	// 	statusService,
	// 	notificationService,
	// });
	// const jobQueue = await JobQueue.create({
	// 	db,
	// 	jobQueueHelper,
	// 	logger,
	// 	stringService,
	// });

	const pulseQueueHelper = new PulseQueueHelper({
		db,
		logger,
		networkService,
		statusService,
		notificationService,
	});
	const pulseQueue = await PulseQueue.create({
		appSettings,
		db,
		pulseQueueHelper,
		logger,
	});

	// Register services
	// ServiceRegistry.register(JobQueue.SERVICE_NAME, jobQueue);
	ServiceRegistry.register(JobQueue.SERVICE_NAME, pulseQueue);
	ServiceRegistry.register(MongoDB.SERVICE_NAME, db);
	ServiceRegistry.register(SettingsService.SERVICE_NAME, settingsService);
	ServiceRegistry.register(EmailService.SERVICE_NAME, emailService);
	ServiceRegistry.register(NetworkService.SERVICE_NAME, networkService);
	ServiceRegistry.register(BufferService.SERVICE_NAME, bufferService);
	ServiceRegistry.register(StatusService.SERVICE_NAME, statusService);
	ServiceRegistry.register(NotificationService.SERVICE_NAME, notificationService);
	ServiceRegistry.register(TranslationService.SERVICE_NAME, translationService);
	ServiceRegistry.register(RedisService.SERVICE_NAME, redisService);

	await translationService.initialize();

	const port = appSettings.port || 52345;
	server = app.listen(port, () => {
		logger.info({ message: `Server started on port:${port}` });
	});

	process.on("SIGUSR2", shutdown);
	process.on("SIGINT", shutdown);
	process.on("SIGTERM", shutdown);

	//Create controllers
	const authController = new AuthController({
		db: ServiceRegistry.get(MongoDB.SERVICE_NAME),
		settingsService: ServiceRegistry.get(SettingsService.SERVICE_NAME),
		emailService: ServiceRegistry.get(EmailService.SERVICE_NAME),
		jobQueue: ServiceRegistry.get(JobQueue.SERVICE_NAME),
		stringService: ServiceRegistry.get(StringService.SERVICE_NAME),
		logger: logger,
	});

	const monitorController = new MonitorController(
		ServiceRegistry.get(MongoDB.SERVICE_NAME),
		ServiceRegistry.get(SettingsService.SERVICE_NAME),
		ServiceRegistry.get(JobQueue.SERVICE_NAME),
		ServiceRegistry.get(StringService.SERVICE_NAME),
		ServiceRegistry.get(EmailService.SERVICE_NAME),
		ServiceRegistry.get(networkService.SERVICE_NAME)
	);

	const settingsController = new SettingsController({
		db: ServiceRegistry.get(MongoDB.SERVICE_NAME),
		settingsService: ServiceRegistry.get(SettingsService.SERVICE_NAME),
		stringService: ServiceRegistry.get(StringService.SERVICE_NAME),
		emailService: ServiceRegistry.get(EmailService.SERVICE_NAME),
	});

	const checkController = new CheckController(
		ServiceRegistry.get(MongoDB.SERVICE_NAME),
		ServiceRegistry.get(SettingsService.SERVICE_NAME),
		ServiceRegistry.get(StringService.SERVICE_NAME)
	);

	const inviteController = new InviteController(
		ServiceRegistry.get(MongoDB.SERVICE_NAME),
		ServiceRegistry.get(SettingsService.SERVICE_NAME),
		ServiceRegistry.get(EmailService.SERVICE_NAME),
		ServiceRegistry.get(StringService.SERVICE_NAME)
	);

	const maintenanceWindowController = new MaintenanceWindowController(
		ServiceRegistry.get(MongoDB.SERVICE_NAME),
		ServiceRegistry.get(SettingsService.SERVICE_NAME),
		ServiceRegistry.get(StringService.SERVICE_NAME)
	);

	const queueController = new QueueController(
		ServiceRegistry.get(JobQueue.SERVICE_NAME),
		ServiceRegistry.get(StringService.SERVICE_NAME)
	);

	const logController = new LogController(logger);

	const statusPageController = new StatusPageController(
		ServiceRegistry.get(MongoDB.SERVICE_NAME),
		ServiceRegistry.get(StringService.SERVICE_NAME)
	);

	const notificationController = new NotificationController({
		notificationService: ServiceRegistry.get(NotificationService.SERVICE_NAME),
		stringService: ServiceRegistry.get(StringService.SERVICE_NAME),
		statusService: ServiceRegistry.get(StatusService.SERVICE_NAME),
		db: ServiceRegistry.get(MongoDB.SERVICE_NAME),
	});

	const diagnosticController = new DiagnosticController(
		ServiceRegistry.get(MongoDB.SERVICE_NAME)
	);

	//Create routes
	const authRoutes = new AuthRoutes(authController);
	const monitorRoutes = new MonitorRoutes(monitorController);
	const settingsRoutes = new SettingsRoutes(settingsController);
	const checkRoutes = new CheckRoutes(checkController);
	const inviteRoutes = new InviteRoutes(inviteController);
	const maintenanceWindowRoutes = new MaintenanceWindowRoutes(
		maintenanceWindowController
	);
	const queueRoutes = new QueueRoutes(queueController);
	const logRoutes = new LogRoutes(logController);
	const statusPageRoutes = new StatusPageRoutes(statusPageController);

	const notificationRoutes = new NotificationRoutes(notificationController);
	const diagnosticRoutes = new DiagnosticRoutes(diagnosticController);
	// Middleware
	app.use(express.static(frontendPath));
	app.use(responseHandler);
	app.use(
		cors({
			origin: allowedOrigin,
			methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
			allowedHeaders: "*",
			credentials: true,
		})
	);
	app.use(express.json());
	app.use(
		helmet({
			hsts: false,
			contentSecurityPolicy: {
				useDefaults: true,
				directives: {
					upgradeInsecureRequests: null,
				},
			},
		})
	);
	app.use(
		compression({
			level: 6,
			threshold: 1024,
			filter: (req, res) => {
				if (req.headers["x-no-compression"]) {
					return false;
				}
				return compression.filter(req, res);
			},
		})
	);

	app.use(languageMiddleware(stringService, translationService, settingsService));
	// Swagger UI
	app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

	//routes
	app.use("/api/v1/auth", authRoutes.getRouter());
	app.use("/api/v1/settings", verifyJWT, settingsRoutes.getRouter());
	app.use("/api/v1/invite", inviteRoutes.getRouter());
	app.use("/api/v1/monitors", verifyJWT, monitorRoutes.getRouter());
	app.use("/api/v1/checks", verifyJWT, checkRoutes.getRouter());
	app.use("/api/v1/maintenance-window", verifyJWT, maintenanceWindowRoutes.getRouter());
	app.use("/api/v1/queue", verifyJWT, queueRoutes.getRouter());
	app.use("/api/v1/logs", verifyJWT, logRoutes.getRouter());
	app.use("/api/v1/status-page", statusPageRoutes.getRouter());
	app.use("/api/v1/notifications", verifyJWT, notificationRoutes.getRouter());
	app.use("/api/v1/diagnostic", verifyJWT, diagnosticRoutes.getRouter());
	app.use("/api/v1/health", (req, res) => {
		res.json({
			status: "OK",
		});
	});
	// FE routes
	app.get("*", (req, res) => {
		res.sendFile(path.join(frontendPath, "index.html"));
	});
	app.use(handleErrors);
};

startApp().catch((error) => {
	logger.error({
		message: error.message,
		service: SERVICE_NAME,
		method: "startApp",
		stack: error.stack,
	});
	process.exit(1);
});
