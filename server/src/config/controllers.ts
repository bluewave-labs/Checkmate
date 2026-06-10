import MonitorController from "../api/controllers/monitorController.js";
import AuthController from "../api/controllers/authController.js";
import SettingsController from "../api/controllers/settingsController.js";
import CheckController from "../api/controllers/checkController.js";
import GeoCheckController from "../api/controllers/geoCheckController.js";
import InviteController from "../api/controllers/inviteController.js";
import MaintenanceWindowController from "../api/controllers/maintenanceWindowController.js";
import QueueController from "../api/controllers/queueController.js";
import LogController from "../api/controllers/logController.js";
import StatusPageController from "../api/controllers/statusPageController.js";
import NotificationController from "../api/controllers/notificationController.js";
import TagsController from "../api/controllers/tagController.js";
import DiagnosticController from "../api/controllers/diagnosticController.js";
import IncidentController from "../api/controllers/incidentController.js";
import type { InitializedServices } from "@/config/services.js";

export interface InitializedControllers {
	authController: AuthController;
	monitorController: MonitorController;
	settingsController: SettingsController;
	checkController: CheckController;
	geoCheckController: GeoCheckController;
	inviteController: InviteController;
	maintenanceWindowController: MaintenanceWindowController;
	queueController: QueueController;
	logController: LogController;
	statusPageController: StatusPageController;
	notificationController: NotificationController;
	tagController: TagsController;
	diagnosticController: DiagnosticController;
	incidentController: IncidentController;
}
export const initializeControllers = (services: InitializedServices): InitializedControllers => {
	return {
		authController: new AuthController(services.userService),
		monitorController: new MonitorController(services.monitorService, services.notificationsService),
		settingsController: new SettingsController(services.settingsService, services.emailService),
		checkController: new CheckController(services.checkService),
		geoCheckController: new GeoCheckController(services.geoChecksService),
		inviteController: new InviteController(services.inviteService),
		maintenanceWindowController: new MaintenanceWindowController(services.maintenanceWindowService),
		queueController: new QueueController(services.worker),
		logController: new LogController(services.logger),
		statusPageController: new StatusPageController(services.statusPageService, services.monitorsRepository, services.settingsService),
		notificationController: new NotificationController(services.notificationsService, services.monitorsRepository),
		tagController: new TagsController(services.tagsService),
		diagnosticController: new DiagnosticController(services.diagnosticService),
		incidentController: new IncidentController(services.incidentService),
	};
};
