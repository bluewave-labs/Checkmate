import { Router } from "express";
import { isAllowed } from "@/middleware/isAllowed.js";
import { ILogController } from "@/controllers/logController.js";
class LogRoutes {
	private router: Router;
	private logController: ILogController;

	constructor(logController: ILogController) {
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
