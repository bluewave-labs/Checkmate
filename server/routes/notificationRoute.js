import { Router } from "express";
import { verifyJWT } from "../middleware/verifyJWT.js";
import { verifyOwnership } from "../middleware/verifyOwnership.js";
import { verifyTeamAccess } from "../middleware/verifyTeamAccess.js";
import Notification from "../db/models/Notification.js";
class NotificationRoutes {
	constructor(notificationController) {
		this.router = Router();
		this.notificationController = notificationController;
		this.initializeRoutes();
	}

	initializeRoutes() {
		this.router.use(verifyJWT);

		this.router.post("/test", this.notificationController.testNotification);
		this.router.post("/test/all", this.notificationController.testAllNotifications);

		this.router.post("/", this.notificationController.createNotification);

		this.router.get("/team", this.notificationController.getNotificationsByTeamId);

		this.router.delete(
			"/:id",
			verifyOwnership(Notification, "id"),
			this.notificationController.deleteNotification
		);

		this.router.get("/:id", this.notificationController.getNotificationById);
		this.router.put(
			"/:id",
			verifyTeamAccess(Notification, "id"),
			this.notificationController.editNotification
		);
	}

	getRouter() {
		return this.router;
	}
}

export default NotificationRoutes;
