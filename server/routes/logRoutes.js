import { Router } from "express";
import { isAllowed } from "../middleware/isAllowed.js";
class LogRoutes {
	constructor(logController) {
		this.router = Router();
		this.logController = logController;
		this.initRoutes();
	}
	initRoutes() {
		this.router.get("/", isAllowed(["admin", "superadmin"]), this.logController.getLogs);
	}

	getRouter() {
		return this.router;
	}
}

export default LogRoutes;
