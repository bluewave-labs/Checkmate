import { Router } from "express";
import { isAllowed } from "../middleware/isAllowed.js";
class LogRoutes {
	private router: Router;
	private logController: any;

	constructor(logController: any) {
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
