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
import { ApiServices } from "@/config/services.api.js";

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
export const initializeControllers = (apiServices: ApiServices): InitializedControllers => {
	return {
		authController: new AuthController(apiServices.userService),
		monitorController: new MonitorController(apiServices.monitorService, apiServices.notificationsService),
		settingsController: new SettingsController(apiServices.settingsService, apiServices.emailService),
		checkController: new CheckController(apiServices.checkService),
		geoCheckController: new GeoCheckController(apiServices.geoChecksService),
		inviteController: new InviteController(apiServices.inviteService),
		maintenanceWindowController: new MaintenanceWindowController(apiServices.maintenanceWindowService),
		queueController: new QueueController(apiServices.worker),
		logController: new LogController(apiServices.logger),
		statusPageController: new StatusPageController(apiServices.statusPageService, apiServices.monitorsRepository, apiServices.settingsService),
		notificationController: new NotificationController(apiServices.notificationsService, apiServices.monitorsRepository),
		tagController: new TagsController(apiServices.tagsService),
		diagnosticController: new DiagnosticController(apiServices.diagnosticService),
		incidentController: new IncidentController(apiServices.incidentService),
	};
};
