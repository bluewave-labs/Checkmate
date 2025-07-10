import { Router } from "express";

class DiagnosticRoutes {
	constructor(diagnosticController) {
		this.router = Router();
		this.diagnosticController = diagnosticController;
		this.initRoutes();
	}
	initRoutes() {
		this.router.get(
			"/db/get-monitors-by-team-id/:teamId",
			this.diagnosticController.getMonitorsByTeamIdExecutionStats
		);

		this.router.post("/db/stats", this.diagnosticController.getDbStats);
		this.router.get("/system", this.diagnosticController.getSystemStats);
	}

	getRouter() {
		return this.router;
	}
}

export default DiagnosticRoutes;
