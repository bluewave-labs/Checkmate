import { RequestHandler, Router } from "express";
import { isAllowed } from "../middleware/isAllowed.js";
import { IDiagnosticController } from "@/controllers/diagnosticController.js";

class DiagnosticRoutes {
	private router: Router;
	private diagnosticController: IDiagnosticController;

	constructor(diagnosticController: IDiagnosticController, verifyJWT: RequestHandler) {
		this.router = Router();
		this.diagnosticController = diagnosticController;
		this.initRoutes(verifyJWT);
	}

	initRoutes(verifyJWT: RequestHandler) {
		this.router.get("/system", verifyJWT, isAllowed(["admin", "superadmin"]), this.diagnosticController.getSystemStats);
	}

	getRouter() {
		return this.router;
	}
}

export default DiagnosticRoutes;
