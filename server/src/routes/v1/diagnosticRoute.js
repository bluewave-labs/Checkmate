import { Router } from "express";
import { verifyJWT } from "../../middleware/v1/verifyJWT.js";
import { isAllowed } from "../../middleware/v1/isAllowed.js";

class DiagnosticRoutes {
	constructor(diagnosticController) {
		this.router = Router();
		this.diagnosticController = diagnosticController;
		this.initRoutes();
	}
	initRoutes() {
		this.router.get("/system", verifyJWT, isAllowed(["admin", "superadmin"]), this.diagnosticController.getSystemStats);
	}

	getRouter() {
		return this.router;
	}
}

export default DiagnosticRoutes;
