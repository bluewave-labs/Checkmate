import { createCommonDependencies } from "../controllers/baseController.js";

// Services

// Controllers
import MonitorController from "../controllers/monitorController.js";
import AuthController from "../controllers/authController.js";
import SettingsController from "../controllers/settingsController.js";
import CheckController from "../controllers/checkController.js";
import InviteController from "../controllers/inviteController.js";
import MaintenanceWindowController from "../controllers/maintenanceWindowController.js";
import QueueController from "../controllers/queueController.js";
import LogController from "../controllers/logController.js";
import StatusPageController from "../controllers/statusPageController.js";
import NotificationController from "../controllers/notificationController.js";
import DiagnosticController from "../controllers/diagnosticController.js";

export const initializeControllers = (services) => {
	const controllers = {};
	const commonDependencies = createCommonDependencies(services.db, services.logger, services.errorService, services.stringService);

	controllers.authController = new AuthController(commonDependencies, {
		settingsService: services.settingsService,
		emailService: services.emailService,
		jobQueue: services.jobQueue,
		userService: services.userService,
	});

	controllers.monitorController = new MonitorController(commonDependencies, {
		settingsService: services.settingsService,
		jobQueue: services.jobQueue,
		emailService: services.emailService,
		monitorService: services.monitorService,
	});

	controllers.settingsController = new SettingsController(commonDependencies, {
		settingsService: services.settingsService,
		emailService: services.emailService,
	});
	controllers.checkController = new CheckController(commonDependencies, {
		settingsService: services.settingsService,
		checkService: services.checkService,
	});
	controllers.inviteController = new InviteController(commonDependencies, {
		inviteService: services.inviteService,
	});

	controllers.maintenanceWindowController = new MaintenanceWindowController(commonDependencies, {
		settingsService: services.settingsService,
		maintenanceWindowService: services.maintenanceWindowService,
	});
	controllers.queueController = new QueueController(commonDependencies, {
		jobQueue: services.jobQueue,
	});
	controllers.logController = new LogController(commonDependencies);
	controllers.statusPageController = new StatusPageController(commonDependencies);
	controllers.notificationController = new NotificationController(commonDependencies, {
		notificationService: services.notificationService,
		statusService: services.statusService,
	});
	controllers.diagnosticController = new DiagnosticController(commonDependencies, {
		diagnosticService: services.diagnosticService,
	});

	return controllers;
};
