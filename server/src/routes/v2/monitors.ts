import { Router } from "express";
import MonitorController from "../../controllers/v2/MonitorController.js";
import { verifyToken } from "../../middleware/v2/VerifyToken.js";
import { verifyPermission } from "../../middleware/v2/VerifyPermissions.js";

class MonitorRoutes {
	private router;
	private controller;
	constructor(monitorController: MonitorController) {
		this.router = Router();
		this.controller = monitorController;
		this.initRoutes();
	}

	initRoutes = () => {
		this.router.post("/", verifyToken, verifyPermission(["monitors.create"]), this.controller.create);

		this.router.get("/", verifyToken, verifyPermission(["monitors.view"]), this.controller.getAll);

		this.router.get("/:id/checks", verifyToken, verifyPermission(["monitors.view"]), this.controller.getChecks);

		this.router.patch("/:id/active", verifyToken, verifyPermission(["monitors.update"]), this.controller.toggleActive);

		this.router.get("/:id", verifyToken, verifyPermission(["monitors.view"]), this.controller.get);

		this.router.patch("/:id", verifyToken, verifyPermission(["monitors.update"]), this.controller.update);

		this.router.delete("/:id", verifyToken, verifyPermission(["monitors.delete"]), this.controller.delete);
	};

	getRouter() {
		return this.router;
	}
}

export default MonitorRoutes;
