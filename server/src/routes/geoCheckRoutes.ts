import { Router } from "express";

class GeoCheckRoutes {
	private router: Router;
	private geoCheckController: any;

	constructor(geoCheckController: any) {
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
