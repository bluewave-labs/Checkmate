import { RequestHandler, Router } from "express";
import { isAllowed } from "../middleware/isAllowed.js";
import { IDiagnosticController } from "@/api/controllers/diagnosticController.js";

export const createDiagnosticRoutes = (diagnosticController: IDiagnosticController, verifyJWT: RequestHandler): Router => {
	const router = Router();
	router.get("/system", verifyJWT, isAllowed(["admin", "superadmin"]), diagnosticController.getSystemStats);
	return router;
};
