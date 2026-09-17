import { INotificationController } from "@/api/controllers/notificationController.js";
import { isAllowed } from "@/api/middleware/isAllowed.js";
import { Router } from "express";

export const createNotificationRoutes = (notificationController: INotificationController): Router => {
	const router = Router();
	router.post("/", isAllowed(["admin", "superadmin"]), notificationController.createNotification);
	router.post("/test/all", isAllowed(["admin", "superadmin"]), notificationController.testAllNotifications);
	router.post("/test", isAllowed(["admin", "superadmin"]), notificationController.testNotification);
	router.get("/team", notificationController.getNotificationsByTeamId);
	router.get("/:id", notificationController.getNotificationById);
	router.delete("/:id", isAllowed(["admin", "superadmin"]), notificationController.deleteNotification);
	router.patch("/:id", isAllowed(["admin", "superadmin"]), notificationController.editNotification);
	return router;
};
