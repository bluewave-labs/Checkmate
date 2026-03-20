import { Router } from "express";
import { isAllowed } from "@/middleware/isAllowed.js";
import { IJobQueueController } from "@/controllers/queueController.js";
class QueueRoutes {
	private router: Router;
	private queueController: IJobQueueController;

	constructor(queueController: IJobQueueController) {
		this.router = Router();
		this.queueController = queueController;
		this.initRoutes();
	}
	initRoutes() {
		this.router.get("/jobs", isAllowed(["admin", "superadmin"]), this.queueController.getJobs);

		this.router.get("/metrics", isAllowed(["admin", "superadmin"]), this.queueController.getMetrics);
		this.router.get("/all-metrics", isAllowed(["admin", "superadmin"]), this.queueController.getAllMetrics);
		this.router.post("/flush", isAllowed(["admin", "superadmin"]), this.queueController.flushQueue);
	}

	getRouter() {
		return this.router;
	}
}

export default QueueRoutes;
