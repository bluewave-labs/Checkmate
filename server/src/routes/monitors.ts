import { Router } from "express";
import { MonitorController } from "@/controllers/index.js";
import { verifyToken } from "@/middleware/VerifyToken.js";
import { verifyTeamPermission } from "@/middleware/VerifyPermission.js";
import { addUserContext } from "@/middleware/AddUserContext.js";
import { PERMISSIONS } from "@/services/business/AuthService.js";
import { validateBody, validateQuery } from "@/middleware/validation.js";
import {
  monitorSchema,
  monitorIdChecksQuerySchema,
  monitorPatchSchema,
  monitorAllEmbedChecksQuerySchema,
} from "@/validation/index.js";
import { verify } from "node:crypto";

class MonitorRoutes {
  private router;
  private controller;
  constructor(monitorController: MonitorController) {
    this.router = Router();
    this.controller = monitorController;
    this.initRoutes();
  }

  initRoutes = () => {
    this.router.post(
      "/",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.monitors.write]),
      validateBody(monitorSchema),
      this.controller.create
    );

    this.router.get(
      "/",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.monitors.read]),
      validateQuery(monitorAllEmbedChecksQuerySchema),
      this.controller.getAll
    );

    this.router.get(
      "/:id/checks",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.monitors.read]),
      validateQuery(monitorIdChecksQuerySchema),
      this.controller.getChecks
    );

    this.router.post(
      "/:id/notifications/test",
      verifyToken,
      addUserContext,
      verifyTeamPermission([
        PERMISSIONS.monitors.read,
        PERMISSIONS.notifications.read,
      ]),
      this.controller.testNotifications
    );

    this.router.patch(
      "/:id/active",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.monitors.write]),
      this.controller.toggleActive
    );

    this.router.get(
      "/:id",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.monitors.read]),
      this.controller.get
    );

    this.router.patch(
      "/:id",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.monitors.write]),
      validateBody(monitorPatchSchema),
      this.controller.update
    );

    this.router.delete(
      "/:id",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.monitors.delete]),
      this.controller.delete
    );
  };

  getRouter() {
    return this.router;
  }
}

export default MonitorRoutes;
