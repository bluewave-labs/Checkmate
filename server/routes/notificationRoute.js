import { Router } from "express";
import { verifyJWT } from "../middleware/verifyJWT.js";

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

		this.router.delete("/:id", this.notificationController.deleteNotification);

		this.router.get("/:id", this.notificationController.getNotificationById);
		this.router.put("/:id", this.notificationController.editNotification);
	}

	getRouter() {
		return this.router;
	}
}

export default NotificationRoutes;
