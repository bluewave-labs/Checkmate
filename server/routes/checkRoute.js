import { Router } from "express";
import { verifyOwnership } from "../middleware/verifyOwnership.js";
import { verifyTeamAccess } from "../middleware/verifyTeamAccess.js";
import { isAllowed } from "../middleware/isAllowed.js";
import Monitor from "../db/models/Monitor.js";
import Check from "../db/models/Check.js";

class CheckRoutes {
	constructor(checkController) {
		this.router = Router();
		this.checkController = checkController;
		this.initRoutes();
	}

	initRoutes() {
		this.router.get("/team", this.checkController.getChecksByTeam);
		this.router.get("/team/summary", this.checkController.getChecksSummaryByTeamId);
		this.router.delete(
			"/team",
			isAllowed(["admin", "superadmin"]),
			this.checkController.deleteChecksByTeamId
		);
		this.router.put(
			"/check/:checkId",
			verifyTeamAccess(Check, "checkId"),
			this.checkController.ackCheck
		);
		this.router.put(
			"/team/ttl",
			isAllowed(["admin", "superadmin"]),
			this.checkController.updateChecksTTL
		);

		this.router.get("/:monitorId", this.checkController.getChecksByMonitor);
		this.router.post(
			"/:monitorId",
			verifyOwnership(Monitor, "monitorId"),
			this.checkController.createCheck
		);
		this.router.delete(
			"/:monitorId",
			verifyOwnership(Monitor, "monitorId"),
			this.checkController.deleteChecks
		);
		this.router.put("/:path/:monitorId?", this.checkController.ackAllChecks);
	}

	getRouter() {
		return this.router;
	}
}

export default CheckRoutes;
