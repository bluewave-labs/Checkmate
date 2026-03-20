import { Router } from "express";
import { isAllowed } from "../middleware/isAllowed.js";
import { IIncidentController } from "@/controllers/incidentController.js";

class IncidentRoutes {
	private router: Router;
	private incidentController: IIncidentController;

	constructor(incidentController: IIncidentController) {
		this.router = Router();
		this.incidentController = incidentController;
		this.initRoutes();
	}

	initRoutes() {
		// Team routes
		this.router.get("/team", this.incidentController.getIncidentsByTeam);
		this.router.get("/team/summary", this.incidentController.getIncidentSummary);

		// Individual incident routes
		this.router.get("/:incidentId", this.incidentController.getIncidentById);
		this.router.put("/:incidentId/resolve", isAllowed(["admin", "superadmin"]), this.incidentController.resolveIncidentManually);
	}

	getRouter() {
		return this.router;
	}
}

export default IncidentRoutes;
