import { Router } from "express";
class NotificationRoutes {
	constructor(notificationController) {
		this.router = Router();
		this.notificationController = notificationController;
		this.initializeRoutes();
	}

	initializeRoutes() {
		this.router.post("/", this.notificationController.createNotification);

		this.router.post("/test/all", this.notificationController.testAllNotifications);
		this.router.post("/test", this.notificationController.testNotification);

		this.router.get("/team", this.notificationController.getNotificationsByTeamId);

		this.router.get("/:id", this.notificationController.getNotificationById);
		this.router.delete("/:id", this.notificationController.deleteNotification);
		this.router.put("/:id", this.notificationController.editNotification);
	}

	getRouter() {
		return this.router;
	}
}

export default NotificationRoutes;
