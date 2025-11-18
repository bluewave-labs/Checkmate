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

// V2 Controllers
import AuthControllerV2 from "../controllers/v2/AuthController.js";
import InviteControllerV2 from "../controllers/v2/InviteController.js";
import MaintenanceControllerV2 from "../controllers/v2/MaintenanceController.js";
import MonitorControllerV2 from "../controllers/v2/MonitorController.js";
import NotificationChannelControllerV2 from "../controllers/v2/NotificationChannelController.js";
import QueueControllerV2 from "../controllers/v2/QueueController.js";
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

	controllers.incidentController = new IncidentController(commonDependencies, {
		incidentService: services.incidentService,
	});

	//V2
	controllers.authControllerV2 = new AuthControllerV2(services.authServiceV2, services.inviteServiceV2);
	controllers.inviteControllerV2 = new InviteControllerV2(services.inviteServiceV2);
	controllers.maintenanceControllerV2 = new MaintenanceControllerV2(services.maintenanceServiceV2);
	controllers.monitorControllerV2 = new MonitorControllerV2(services.monitorServiceV2, services.checkServiceV2);
	controllers.notificationChannelControllerV2 = new NotificationChannelControllerV2(services.notificationChannelServiceV2);
	controllers.queueControllerV2 = new QueueControllerV2(services.jobQueueV2);

	return controllers;
};
