import { Router } from "express";
import { DiagnosticController } from "@/controllers/index.js";
import { verifyToken } from "@/middleware/VerifyToken.js";
import { verifyOrgPermission } from "@/middleware/VerifyPermission.js";
import { addUserContext } from "@/middleware/AddUserContext.js";
import { PERMISSIONS } from "@/types/permissions.js";

class DiagnosticRoutes {
  private router;
  private controller;
  constructor(diagnosticController: DiagnosticController) {
    this.router = Router();
    this.controller = diagnosticController;
    this.initRoutes();
  }

  initRoutes = () => {
    this.router.get(
      "/logs",
      verifyToken,
      addUserContext,
      verifyOrgPermission([PERMISSIONS.master]),
      this.controller.getLogs
    );
    this.router.get(
      "/jobs",
      verifyToken,
      addUserContext,
      verifyOrgPermission([PERMISSIONS.master]),
      this.controller.getJobs
    );
  };

  getRouter() {
    return this.router;
  }
}

export default DiagnosticRoutes;
