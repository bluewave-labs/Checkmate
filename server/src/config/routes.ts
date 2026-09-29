import type { Application } from "express";
import { createVerifyJWT } from "../api/middleware/verifyJWT.js";
import { createVerifyStatusPageAccess } from "../api/middleware/verifyStatusPageAccess.js";
import { authApiLimiter } from "../api/middleware/rateLimiter.js";
import type { InitializedControllers } from "./controllers.js";
import type { ApiServices } from "@/config/services.api.js";

import { createSettingsRoutes } from "@/api/routes/settingsRoutes.js";
import { createQueueRoutes } from "@/api/routes/queueRoutes.js";
import { createLogRoutes } from "@/api/routes/logRoutes.js";
import { createStatusPageRoutes } from "@/api/routes/statusPageRoutes.js";
import { AuthMiddleware, buildRouter } from "@/api/routes/buildRouter.js";

import { tagRoutes } from "@/api/routes/tagRoutes.js";
import { authRoutes } from "@/api/routes/authRoutes.js";
import { checkRoutes } from "@/api/routes/checkRoutes.js";
import { diagnosticRoutes } from "@/api/routes/diagnosticRoutes.js";
import { geoCheckRoutes } from "@/api/routes/geoCheckRoutes.js";
import { incidentRoutes } from "@/api/routes/incidentRoutes.js";
import { inviteRoutes } from "@/api/routes/inviteRoutes.js";
import { maintenanceWindowRoutes } from "@/api/routes/maintenanceWindowRoutes.js";
import { monitorRoutes } from "@/api/routes/monitorRoutes.js";
import { notificationRoutes } from "@/api/routes/notificationRoutes.js";
import { proxyRoutes } from "@/api/routes/proxyRoutes.js";
export const setupRoutes = (app: Application, controllers: InitializedControllers, apiServices: ApiServices) => {
	const verifyJWT = createVerifyJWT(apiServices.settingsService);
	const verifyStatusPageAccess = createVerifyStatusPageAccess(apiServices.statusPagesRepository, verifyJWT);
	const middleware: AuthMiddleware = {
		jwt: verifyJWT,
		statusPage: verifyStatusPageAccess,
	};

	const settingsRoutes = createSettingsRoutes(controllers.settingsController);
	const queueRoutes = createQueueRoutes(controllers.queueController);
	const logRoutes = createLogRoutes(controllers.logController);
	const statusPageRoutes = createStatusPageRoutes(controllers.statusPageController, verifyJWT, verifyStatusPageAccess);

	app.use("/api/v1/auth", authApiLimiter, buildRouter(authRoutes, controllers.authController, middleware));
	app.use("/api/v1/monitors", buildRouter(monitorRoutes, controllers.monitorController, middleware));
	app.use("/api/v1/settings", verifyJWT, settingsRoutes);
	app.use("/api/v1/checks", buildRouter(checkRoutes, controllers.checkController, middleware));
	app.use("/api/v1/geo-checks", buildRouter(geoCheckRoutes, controllers.geoCheckController, middleware));
	app.use("/api/v1/invite", buildRouter(inviteRoutes, controllers.inviteController, middleware));
	app.use("/api/v1/maintenance-window", buildRouter(maintenanceWindowRoutes, controllers.maintenanceWindowController, middleware));
	app.use("/api/v1/queue", verifyJWT, queueRoutes);
	app.use("/api/v1/logs", verifyJWT, logRoutes);
	app.use("/api/v1/status-page", statusPageRoutes);
	app.use("/api/v1/notifications", buildRouter(notificationRoutes, controllers.notificationController, middleware));
	app.use("/api/v1/tags", buildRouter(tagRoutes, controllers.tagController, middleware));
	app.use("/api/v1/diagnostic", buildRouter(diagnosticRoutes, controllers.diagnosticController, middleware));
	app.use("/api/v1/incidents", buildRouter(incidentRoutes, controllers.incidentController, middleware));
	app.use("/api/v1/proxies", buildRouter(proxyRoutes, controllers.proxyController, middleware));
};
