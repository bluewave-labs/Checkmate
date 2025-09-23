import { verifyJWT } from "../middleware/v1/verifyJWT.js";
import { authApiLimiter } from "../middleware/v1/rateLimiter.js";

import AuthRoutes from "../routes/v1/authRoute.js";
import InviteRoutes from "../routes/v1//inviteRoute.js";
import MonitorRoutes from "../routes/v1/monitorRoute.js";
import CheckRoutes from "../routes/v1/checkRoute.js";
import SettingsRoutes from "../routes/v1/settingsRoute.js";
import MaintenanceWindowRoutes from "../routes/v1/maintenanceWindowRoute.js";
import StatusPageRoutes from "../routes/v1/statusPageRoute.js";
import QueueRoutes from "../routes/v1/queueRoute.js";
import LogRoutes from "../routes/v1/logRoutes.js";
import DiagnosticRoutes from "../routes/v1//diagnosticRoute.js";
import NotificationRoutes from "../routes/v1/notificationRoute.js";

export const setupRoutes = (app, controllers) => {
	const authRoutes = new AuthRoutes(controllers.authController);
	const monitorRoutes = new MonitorRoutes(controllers.monitorController);
	const settingsRoutes = new SettingsRoutes(controllers.settingsController);
	const checkRoutes = new CheckRoutes(controllers.checkController);
	const inviteRoutes = new InviteRoutes(controllers.inviteController);
	const maintenanceWindowRoutes = new MaintenanceWindowRoutes(controllers.maintenanceWindowController);
	const queueRoutes = new QueueRoutes(controllers.queueController);
	const logRoutes = new LogRoutes(controllers.logController);
	const statusPageRoutes = new StatusPageRoutes(controllers.statusPageController);
	const notificationRoutes = new NotificationRoutes(controllers.notificationController);
	const diagnosticRoutes = new DiagnosticRoutes(controllers.diagnosticController);

	app.use("/api/v1/auth", authApiLimiter, authRoutes.getRouter());
	app.use("/api/v1/monitors", verifyJWT, monitorRoutes.getRouter());
	app.use("/api/v1/settings", verifyJWT, settingsRoutes.getRouter());
	app.use("/api/v1/checks", verifyJWT, checkRoutes.getRouter());
	app.use("/api/v1/invite", inviteRoutes.getRouter());
	app.use("/api/v1/maintenance-window", verifyJWT, maintenanceWindowRoutes.getRouter());
	app.use("/api/v1/queue", verifyJWT, queueRoutes.getRouter());
	app.use("/api/v1/logs", verifyJWT, logRoutes.getRouter());
	app.use("/api/v1/status-page", statusPageRoutes.getRouter());
	app.use("/api/v1/notifications", verifyJWT, notificationRoutes.getRouter());
	app.use("/api/v1/diagnostic", verifyJWT, diagnosticRoutes.getRouter());
};
