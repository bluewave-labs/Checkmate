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
import IncidentController from "../controllers/incidentController.js";
import type { InitializedSerivces } from "@/config/services.js";
export const initializeControllers = (services: InitializedSerivces) => {
	const controllers: Record<string, any> = {};

	controllers.authController = new AuthController(services.userService);

	controllers.monitorController = new MonitorController(services.monitorService);

	controllers.settingsController = new SettingsController(services.settingsService, services.emailService, services.db);
	controllers.checkController = new CheckController(services.checkService);
	controllers.inviteController = new InviteController(services.inviteService);

	controllers.maintenanceWindowController = new MaintenanceWindowController(services.maintenanceWindowService);
	controllers.queueController = new QueueController(services.jobQueue);
	controllers.logController = new LogController(services.logger);
	controllers.statusPageController = new StatusPageController(services.db);
	controllers.notificationController = new NotificationController(services.notificationService, services.db, services.monitorsRepository);
	controllers.diagnosticController = new DiagnosticController(services.diagnosticService);

	controllers.incidentController = new IncidentController(services.incidentService);

	return controllers;
};
