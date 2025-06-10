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

		this.router.post("/trigger", this.notificationController.triggerNotification);

		this.router.post("/test-webhook", this.notificationController.testWebhook);

		this.router.post("/", this.notificationController.createNotification);

		this.router.get(
			"/team/:teamId",
			this.notificationController.getNotificationsByTeamId
		);

		this.router.delete("/:id", this.notificationController.deleteNotification);
	}

	getRouter() {
		return this.router;
	}
}

export default NotificationRoutes;
