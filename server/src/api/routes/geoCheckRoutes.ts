import { IGeoCheckController } from "@/api/controllers/geoCheckController.js";
import { Router } from "express";

export const createGeoCheckRoutes = (geoCheckController: IGeoCheckController): Router => {
	const router = Router();
	router.get("/:monitorId", geoCheckController.getGeoChecksByMonitor);

	return router;
};
