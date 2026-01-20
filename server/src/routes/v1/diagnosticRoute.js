import { Router } from "express";
import { isAllowed } from "../../middleware/v1/isAllowed.js";

class DiagnosticRoutes {
	constructor(diagnosticController, verifyJWT) {
		this.router = Router();
		this.diagnosticController = diagnosticController;
		this.initRoutes(verifyJWT);
	}

	initRoutes(verifyJWT) {
		this.router.get("/system", verifyJWT, isAllowed(["admin", "superadmin"]), this.diagnosticController.getSystemStats);
	}

	getRouter() {
		return this.router;
	}
}

export default DiagnosticRoutes;
