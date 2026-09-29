import type { Application } from "express";
import { createVerifyJWT } from "../api/middleware/verifyJWT.js";
import { createVerifyStatusPageAccess } from "../api/middleware/verifyStatusPageAccess.js";
import { authApiLimiter } from "../api/middleware/rateLimiter.js";
import type { InitializedControllers } from "./controllers.js";
import type { ApiServices } from "@/config/services.api.js";

import { createMonitorRoutes } from "@/api/routes/monitorRoutes.js";
import { createSettingsRoutes } from "@/api/routes/settingsRoutes.js";
import { createMaintenanceWindowRoutes } from "@/api/routes/maintenanceWindowRoutes.js";
import { createQueueRoutes } from "@/api/routes/queueRoutes.js";
import { createLogRoutes } from "@/api/routes/logRoutes.js";
import { createStatusPageRoutes } from "@/api/routes/statusPageRoutes.js";
import { createNotificationRoutes } from "@/api/routes/notificationRoutes.js";
import { createProxyRoutes } from "@/api/routes/proxyRoutes.js";
import { AuthMiddleware, buildRouter } from "@/api/routes/buildRouter.js";

import { tagRoutes } from "@/api/routes/tagRoutes.js";
import { authRoutes } from "@/api/routes/authRoutes.js";
import { checkRoutes } from "@/api/routes/checkRoutes.js";
import { diagnosticRoutes } from "@/api/routes/diagnosticRoutes.js";
import { geoCheckRoutes } from "@/api/routes/geoCheckRoutes.js";
import { incidentRoutes } from "@/api/routes/incidentRoutes.js";
import { inviteRoutes } from "@/api/routes/inviteRoutes.js";
export const setupRoutes = (app: Application, controllers: InitializedControllers, apiServices: ApiServices) => {
	const verifyJWT = createVerifyJWT(apiServices.settingsService);
	const verifyStatusPageAccess = createVerifyStatusPageAccess(apiServices.statusPagesRepository, verifyJWT);
	const middleware: AuthMiddleware = {
		jwt: verifyJWT,
		statusPage: verifyStatusPageAccess,
	};

	const monitorRoutes = createMonitorRoutes(controllers.monitorController);
	const settingsRoutes = createSettingsRoutes(controllers.settingsController);
	const maintenanceWindowRoutes = createMaintenanceWindowRoutes(controllers.maintenanceWindowController);
	const queueRoutes = createQueueRoutes(controllers.queueController);
	const logRoutes = createLogRoutes(controllers.logController);
	const statusPageRoutes = createStatusPageRoutes(controllers.statusPageController, verifyJWT, verifyStatusPageAccess);
	const notificationRoutes = createNotificationRoutes(controllers.notificationController);
	const proxyRoutes = createProxyRoutes(controllers.proxyController);

	app.use("/api/v1/auth", authApiLimiter, buildRouter(authRoutes, controllers.authController, middleware));
	app.use("/api/v1/monitors", verifyJWT, monitorRoutes);
	app.use("/api/v1/settings", verifyJWT, settingsRoutes);
	app.use("/api/v1/checks", buildRouter(checkRoutes, controllers.checkController, middleware));
	app.use("/api/v1/geo-checks", buildRouter(geoCheckRoutes, controllers.geoCheckController, middleware));
	app.use("/api/v1/invite", buildRouter(inviteRoutes, controllers.inviteController, middleware));
	app.use("/api/v1/maintenance-window", verifyJWT, maintenanceWindowRoutes);
	app.use("/api/v1/queue", verifyJWT, queueRoutes);
	app.use("/api/v1/logs", verifyJWT, logRoutes);
	app.use("/api/v1/status-page", statusPageRoutes);
	app.use("/api/v1/notifications", verifyJWT, notificationRoutes);
	app.use("/api/v1/tags", buildRouter(tagRoutes, controllers.tagController, middleware));
	app.use("/api/v1/diagnostic", verifyJWT, buildRouter(diagnosticRoutes, controllers.diagnosticController, middleware));
	app.use("/api/v1/incidents", verifyJWT, buildRouter(incidentRoutes, controllers.incidentController, middleware));
	app.use("/api/v1/proxies", verifyJWT, proxyRoutes);
};
