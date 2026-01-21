import { Router } from "express";

import { isAllowed } from "../middleware/isAllowed.js";

class CheckRoutes {
	private router: Router;
	private checkController: any;

	constructor(checkController: any) {
		this.router = Router();
		this.checkController = checkController;
		this.initRoutes();
	}

	initRoutes() {
		this.router.get("/team/summary", this.checkController.getChecksSummaryByTeamId);
		this.router.get("/team", this.checkController.getChecksByTeam);
		this.router.put("/team/ttl", isAllowed(["admin", "superadmin"]), this.checkController.updateChecksTTL);
		this.router.delete("/team", isAllowed(["admin", "superadmin"]), this.checkController.deleteChecksByTeamId);
		this.router.get("/:monitorId", this.checkController.getChecksByMonitor);
		this.router.delete("/:monitorId", this.checkController.deleteChecks);
	}

	getRouter() {
		return this.router;
	}
}

export default CheckRoutes;
