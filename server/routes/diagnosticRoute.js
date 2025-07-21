import { Router } from "express";
import { verifyJWT } from "../middleware/verifyJWT.js";
import { isAllowed } from "../middleware/isAllowed.js";

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
