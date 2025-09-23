import { createCommonDependencies } from "../controllers/v1/baseController.js";

// Services

// Controllers
import MonitorController from "../controllers/v1/monitorController.js";
import AuthController from "../controllers/v1/authController.js";
import SettingsController from "../controllers/v1/settingsController.js";
import CheckController from "../controllers/v1/checkController.js";
import InviteController from "../controllers/v1/inviteController.js";
import MaintenanceWindowController from "../controllers/v1/maintenanceWindowController.js";
import QueueController from "../controllers/v1/queueController.js";
import LogController from "../controllers/v1/logController.js";
import StatusPageController from "../controllers/v1/statusPageController.js";
import NotificationController from "../controllers/v1/notificationController.js";
import DiagnosticController from "../controllers/v1/diagnosticController.js";

// V2
import AuthV2Controller from "../controllers/v2/AuthController.js";

export const initializeControllers = (services) => {
	const controllers = {};
	const commonDependencies = createCommonDependencies(services.db, services.errorService, services.logger, services.stringService);

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

	// V2
	controllers.authV2Controller = new AuthV2Controller(services.authV2Service, services.inviteV2Service);

	return controllers;
};
