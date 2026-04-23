import { IGeoCheckController } from "@/controllers/geoCheckController.js";
import { Router } from "express";

class GeoCheckRoutes {
	private router: Router;
	private geoCheckController: IGeoCheckController;

	constructor(geoCheckController: IGeoCheckController) {
		this.router = Router();
		this.geoCheckController = geoCheckController;
		this.initRoutes();
	}

	initRoutes() {
		this.router.get("/:monitorId", this.geoCheckController.getGeoChecksByMonitor);
	}

	getRouter() {
		return this.router;
	}
}

export default GeoCheckRoutes;
