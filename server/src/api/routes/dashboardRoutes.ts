import { Router } from "express";
import type { IDashboardController } from "@/api/controllers/dashboardController.js";

export const createDashboardRoutes = (dashboardController: IDashboardController): Router => {
	const router = Router();
	router.get("/summary", dashboardController.getSummary);
	return router;
};
