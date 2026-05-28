import MonitorController from "../controllers/monitorController.js";
import AuthController from "../controllers/authController.js";
import SettingsController from "../controllers/settingsController.js";
import CheckController from "../controllers/checkController.js";
import GeoCheckController from "../controllers/geoCheckController.js";
import InviteController from "../controllers/inviteController.js";
import MaintenanceWindowController from "../controllers/maintenanceWindowController.js";
import QueueController from "../controllers/queueController.js";
import LogController from "../controllers/logController.js";
import StatusPageController from "../controllers/statusPageController.js";
import NotificationController from "../controllers/notificationController.js";
import TagsController from "../controllers/tagController.js";
import DiagnosticController from "../controllers/diagnosticController.js";
import IncidentController from "../controllers/incidentController.js";
import ScriptController from "../controllers/scriptController.js";
import CaptureAgentController from "../controllers/captureAgentController.js";
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
	scriptController: ScriptController;
	captureAgentController: CaptureAgentController;
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
		queueController: new QueueController(services.jobQueue),
		logController: new LogController(services.logger),
		statusPageController: new StatusPageController(services.statusPageService, services.monitorsRepository, services.settingsService),
		notificationController: new NotificationController(services.notificationsService, services.monitorsRepository),
		tagController: new TagsController(services.tagsService),
		diagnosticController: new DiagnosticController(services.diagnosticService),
		incidentController: new IncidentController(services.incidentService),
		scriptController: new ScriptController(services.scriptService),
		captureAgentController: new CaptureAgentController(services.captureAgentService),
	};
};
