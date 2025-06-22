import { Router } from "express";
import { isAllowed } from "../middleware/isAllowed.js";
class QueueRoutes {
	constructor(queueController) {
		this.router = Router();
		this.queueController = queueController;
		this.initRoutes();
	}
	initRoutes() {
		this.router.get(
			"/metrics",
			isAllowed(["admin", "superadmin"]),
			this.queueController.getMetrics
		);

		this.router.get(
			"/jobs",
			isAllowed(["admin", "superadmin"]),
			this.queueController.getJobs
		);

		this.router.get(
			"/all-metrics",
			isAllowed(["admin", "superadmin"]),
			this.queueController.getAllMetrics
		);

		this.router.post(
			"/jobs",
			isAllowed(["admin", "superadmin"]),
			this.queueController.addJob
		);

		this.router.post(
			"/flush",
			isAllowed(["admin", "superadmin"]),
			this.queueController.flushQueue
		);

		this.router.get(
			"/health",
			isAllowed(["admin", "superadmin"]),
			this.queueController.checkQueueHealth
		);
	}

	getRouter() {
		return this.router;
	}
}

export default QueueRoutes;
