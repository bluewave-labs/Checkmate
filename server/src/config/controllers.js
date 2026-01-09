import { createCommonDependencies } from "../controllers/v1/baseController.js";

// Services

// V1 Controllers
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
import IncidentController from "../controllers/v1/incidentController.js";

export const initializeControllers = (services) => {
	const controllers = {};
	const commonDependencies = createCommonDependencies(services.db, services.errorService, services.logger, services.stringService);

	// V1
	controllers.authController = new AuthController(commonDependencies, {
		settingsService: services.settingsService,
		emailService: services.emailService,
		jobQueue: services.jobQueue,
		userService: services.userService,
	});

	controllers.monitorController = new MonitorController(services.monitorService);

	controllers.settingsController = new SettingsController(services.settingsService, services.emailService, services.db);
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
	controllers.queueController = new QueueController(services.jobQueue);
	controllers.logController = new LogController(commonDependencies);
	controllers.statusPageController = new StatusPageController(services.db);
	controllers.notificationController = new NotificationController(services.notificationService, services.db);
	controllers.diagnosticController = new DiagnosticController(commonDependencies, {
		diagnosticService: services.diagnosticService,
	});

	controllers.incidentController = new IncidentController(commonDependencies, {
		incidentService: services.incidentService,
	});

	return controllers;
};
