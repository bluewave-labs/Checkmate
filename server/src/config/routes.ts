import type { Application } from "express";
import { createVerifyJWT } from "../api/middleware/verifyJWT.js";
import { createVerifyStatusPageAccess } from "../api/middleware/verifyStatusPageAccess.js";
import { authApiLimiter } from "../api/middleware/rateLimiter.js";
import type { InitializedControllers } from "./controllers.js";
import type { ApiServices } from "@/config/services.api.js";

import AuthRoutes from "../api/routes/authRoute.js";
import InviteRoutes from "../api/routes/inviteRoute.js";
import MonitorRoutes from "../api/routes/monitorRoute.js";
import CheckRoutes from "../api/routes/checkRoute.js";
import GeoCheckRoutes from "../api/routes/geoCheckRoutes.js";
import SettingsRoutes from "../api/routes/settingsRoute.js";
import MaintenanceWindowRoutes from "../api/routes/maintenanceWindowRoute.js";
import StatusPageRoutes from "../api/routes/statusPageRoute.js";
import QueueRoutes from "../api/routes/queueRoute.js";
import LogRoutes from "../api/routes/logRoutes.js";
import DiagnosticRoutes from "../api/routes/diagnosticRoute.js";
import NotificationRoutes from "../api/routes/notificationRoute.js";
import TagRoutes from "../api/routes/tagRoutes.js";

import IncidentRoutes from "../api/routes/incidentRoute.js";

export const setupRoutes = (app: Application, controllers: InitializedControllers, apiServices: ApiServices) => {
	const verifyJWT = createVerifyJWT(apiServices.settingsService);
	const authRoutes = new AuthRoutes(controllers.authController, verifyJWT);
	const monitorRoutes = new MonitorRoutes(controllers.monitorController);
	const settingsRoutes = new SettingsRoutes(controllers.settingsController);
	const checkRoutes = new CheckRoutes(controllers.checkController);
	const geoCheckRoutes = new GeoCheckRoutes(controllers.geoCheckController);
	const inviteRoutes = new InviteRoutes(controllers.inviteController, verifyJWT);
	const maintenanceWindowRoutes = new MaintenanceWindowRoutes(controllers.maintenanceWindowController);
	const queueRoutes = new QueueRoutes(controllers.queueController);
	const logRoutes = new LogRoutes(controllers.logController);
	const verifyStatusPageAccess = createVerifyStatusPageAccess(apiServices.statusPagesRepository, verifyJWT);
	const statusPageRoutes = new StatusPageRoutes(controllers.statusPageController, verifyJWT, verifyStatusPageAccess);
	const notificationRoutes = new NotificationRoutes(controllers.notificationController);
	const tagRoutes = new TagRoutes(controllers.tagController);
	const diagnosticRoutes = new DiagnosticRoutes(controllers.diagnosticController, verifyJWT);
	const incidentRoutes = new IncidentRoutes(controllers.incidentController);

	app.use("/api/v1/auth", authApiLimiter, authRoutes.getRouter());
	app.use("/api/v1/monitors", verifyJWT, monitorRoutes.getRouter());
	app.use("/api/v1/settings", verifyJWT, settingsRoutes.getRouter());
	app.use("/api/v1/checks", verifyJWT, checkRoutes.getRouter());
	app.use("/api/v1/geo-checks", verifyJWT, geoCheckRoutes.getRouter());
	app.use("/api/v1/invite", inviteRoutes.getRouter());
	app.use("/api/v1/maintenance-window", verifyJWT, maintenanceWindowRoutes.getRouter());
	app.use("/api/v1/queue", verifyJWT, queueRoutes.getRouter());
	app.use("/api/v1/logs", verifyJWT, logRoutes.getRouter());
	app.use("/api/v1/status-page", statusPageRoutes.getRouter());
	app.use("/api/v1/notifications", verifyJWT, notificationRoutes.getRouter());
	app.use("/api/v1/tags", verifyJWT, tagRoutes.getRouter());
	app.use("/api/v1/diagnostic", verifyJWT, diagnosticRoutes.getRouter());
	app.use("/api/v1/incidents", verifyJWT, incidentRoutes.getRouter());
};
