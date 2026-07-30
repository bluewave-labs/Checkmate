import { Router } from "express";
import { isAllowed } from "@/api/middleware/isAllowed.js";
import { IJobQueueController } from "@/api/controllers/queueController.js";

export const createQueueRoutes = (queueController: IJobQueueController): Router => {
	const router = Router();
	router.get("/jobs", isAllowed(["admin", "superadmin"]), queueController.getJobs);
	router.get("/metrics", isAllowed(["admin", "superadmin"]), queueController.getMetrics);
	router.get("/all-metrics", isAllowed(["admin", "superadmin"]), queueController.getAllMetrics);
	router.post("/flush", isAllowed(["admin", "superadmin"]), queueController.flushQueue);
	return router;
};
