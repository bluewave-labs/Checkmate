import { RequestHandler, Router } from "express";
import { isAllowed } from "../middleware/isAllowed.js";

class DiagnosticRoutes {
	private router: Router;
	private diagnosticController: any;

	constructor(diagnosticController: any, verifyJWT: RequestHandler) {
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
