import { Router } from "express";

// Sample middleware placeholders
const validateRequest = (req, res, next) => {
	// Add validation logic or use express-validator
	next();
};

const authenticate = (req, res, next) => {
	// Add auth logic (JWT, session, etc.)
	next();
};

class DiagnosticRoutes {
      constructor(diagnosticController) {
        this.router = Router();
        this.diagnosticController = diagnosticController;
        this.initRoutes();
      }

      initRoutes() {
        this.router.get(
          "/db/monitors/:teamId",
          authenticate,
          validateRequest,
          this.diagnosticController.getMonitorsByTeamIdExecutionStats.bind(this.diagnosticController)
        );

        this.router.post(
          "/db/stats",
          authenticate,
          validateRequest,
          this.diagnosticController.getDbStats.bind(this.diagnosticController)
        );

        this.router.get(
          "/system",
          authenticate,
          this.diagnosticController.getSystemStats.bind(this.diagnosticController)
        );
    }
	}

	getRouter() {
		return this.router;
	}
}

export default DiagnosticRoutes;
