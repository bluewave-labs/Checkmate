import { Router } from "express";
import { isAllowed } from "@/api/middleware/isAllowed.js";

import { ILogController } from "@/api/controllers/logController.js";

export const createLogRoutes = (logController: ILogController): Router => {
	const router = Router();
	router.get("/", isAllowed(["admin", "superadmin"]), logController.getLogs);
	return router;
};
