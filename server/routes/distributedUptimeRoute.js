import { Router } from "express";
import { verifyJWT } from "../middleware/verifyJWT.js";
class DistributedUptimeRoutes {
	constructor(distributedUptimeController) {
		this.router = Router();
		this.distributedUptimeController = distributedUptimeController;
		this.initRoutes();
	}
	initRoutes() {
		this.router.post("/callback", this.distributedUptimeController.resultsCallback);

		this.router.get(
			"/monitors/:teamId/initial",
			verifyJWT,
			this.distributedUptimeController.getDistributedUptimeMonitors
		);

		this.router.get(
			"/monitors/:teamId",
			this.distributedUptimeController.subscribeToDistributedUptimeMonitors
		);

		this.router.get(
			"/monitors/details/:monitorId/initial",
			verifyJWT,
			this.distributedUptimeController.getDistributedUptimeMonitorDetails
		);
		this.router.get(
			"/monitors/details/public/:monitorId/initial",
			this.distributedUptimeController.getDistributedUptimeMonitorDetails
		);

		this.router.get(
			"/monitors/details/:monitorId",
			this.distributedUptimeController.subscribeToDistributedUptimeMonitorDetails
		);
	}

	getRouter() {
		return this.router;
	}
}

export default DistributedUptimeRoutes;
