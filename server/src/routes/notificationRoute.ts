import { INotificationController } from "@/controllers/notificationController.js";
import { Router } from "express";
class NotificationRoutes {
	private router: Router;
	private notificationController: INotificationController;

	constructor(notificationController: INotificationController) {
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
		this.router.patch("/:id", this.notificationController.editNotification);
	}

	getRouter() {
		return this.router;
	}
}

export default NotificationRoutes;
