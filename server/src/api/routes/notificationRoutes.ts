import { INotificationController } from "@/api/controllers/notificationController.js";
import { Router } from "express";

export const createNotificationRoutes = (notificationController: INotificationController): Router => {
	const router = Router();
	router.post("/", notificationController.createNotification);
	router.post("/test/all", notificationController.testAllNotifications);
	router.post("/test", notificationController.testNotification);
	router.get("/team", notificationController.getNotificationsByTeamId);
	router.get("/:id", notificationController.getNotificationById);
	router.delete("/:id", notificationController.deleteNotification);
	router.patch("/:id", notificationController.editNotification);
	return router;
};
