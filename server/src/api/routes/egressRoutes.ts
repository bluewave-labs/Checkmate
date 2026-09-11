import { Router } from "express";
import { IEgressController } from "@/api/controllers/egressController.js";

// Any authenticated role may read the state: the client banner polls it.
export const createEgressRoutes = (egressController: IEgressController): Router => {
	const router = Router();
	router.get("/", egressController.getState);
	return router;
};
