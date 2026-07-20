import { Router } from "express";
import { isAllowed } from "../middleware/isAllowed.js";
import { IIncidentController } from "@/api/controllers/incidentController.js";

export const createIncidentRoutes = (incidentController: IIncidentController): Router => {
	const router = Router();
	router.get("/team", incidentController.getIncidentsByTeam);
	router.get("/team/summary", incidentController.getIncidentSummary);
	router.get("/:incidentId", incidentController.getIncidentById);
	router.put("/:incidentId/resolve", isAllowed(["admin", "superadmin"]), incidentController.resolveIncidentManually);
	return router;
};
