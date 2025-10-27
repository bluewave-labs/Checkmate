import { Router } from "express";
import NotificationController from "../../controllers/v2/NotificationChannelController.js";
import { verifyToken } from "../../middleware/v2/VerifyToken.js";
import { verifyPermission } from "../../middleware/v2/VerifyPermissions.js";

class NotificationChannelRoutes {
	private router;
	private controller;
	constructor(notificationController: NotificationController) {
		this.router = Router();
		this.controller = notificationController;
		this.initRoutes();
	}

	initRoutes = () => {
		this.router.post("/", verifyToken, verifyPermission(["notifications.create"]), this.controller.create);

		this.router.get("/", verifyToken, verifyPermission(["notifications.view"]), this.controller.getAll);

		this.router.patch("/:id/active", verifyToken, verifyPermission(["notifications.update"]), this.controller.toggleActive);

		this.router.patch("/:id", verifyToken, verifyPermission(["notifications.update"]), this.controller.update);

		this.router.get("/:id", verifyToken, verifyPermission(["notifications.view"]), this.controller.get);

		this.router.delete("/:id", verifyToken, verifyPermission(["notifications.delete"]), this.controller.delete);
	};

	getRouter() {
		return this.router;
	}
}

export default NotificationChannelRoutes;
