import { Router } from "express";

import { isAllowed } from "../middleware/isAllowed.js";
import { ICheckController } from "@/api/controllers/checkController.js";

export const createCheckRoutes = (checkController: ICheckController): Router => {
	const router = Router();
	router.get("/team/summary", checkController.getChecksSummaryByTeamId);
	router.get("/team", checkController.getChecksByTeam);
	router.delete("/team", isAllowed(["admin", "superadmin"]), checkController.deleteChecksByTeamId);
	router.get("/:monitorId", checkController.getChecksByMonitor);
	router.delete("/:monitorId", checkController.deleteChecks);
	return router;
};
