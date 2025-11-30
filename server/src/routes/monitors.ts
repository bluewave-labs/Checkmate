import { Router } from "express";
import { MonitorController } from "@/controllers/index.js";
import { verifyToken } from "@/middleware/VerifyToken.js";
import {
  verifyOrgPermission,
  verifyTeamPermission,
} from "@/middleware/VerifyPermission.js";
import { addUserContext } from "@/middleware/AddUserContext.js";
import { PERMISSIONS } from "@/types/permissions.js";
import { validateBody, validateQuery } from "@/middleware/validation.js";
import {
  enforceMax,
  enforceMinInterval,
  requireFeature,
} from "@/middleware/VerifyEntitlements.js";
import { Monitor } from "@/db/models/index.js";
import {
  monitorSchema,
  monitorIdChecksQuerySchema,
  monitorPatchSchema,
  monitorAllEmbedChecksQuerySchema,
  monitorImportSchema,
} from "@/validation/index.js";

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
      enforceMax("monitorsMax", async (req) =>
        Monitor.countDocuments({ orgId: req?.user?.orgId })
      ),
      validateBody(monitorSchema),
      enforceMinInterval("checksIntervalMsMin", (req) => req.body.interval),
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
      "/export",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.monitors.read]),
      this.controller.export
    );
    this.router.post(
      "/import",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.monitors.write]),
      enforceMax("monitorsMax", async (req) =>
        Monitor.countDocuments({ orgId: req?.user?.orgId })
      ),
      validateBody(monitorImportSchema),
      this.controller.import
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
      requireFeature("notificationsEnabled"),
      this.controller.testNotifications
    );

    this.router.patch(
      "/:id/active",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.monitors.write]),
      this.controller.togglePause
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
      enforceMinInterval("checksIntervalMsMin", (req) => req.body.interval),

      this.controller.update
    );

    this.router.delete(
      "/:id",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.monitors.delete]),
      this.controller.delete
    );
    this.router.delete(
      "/",
      verifyToken,
      addUserContext,
      verifyOrgPermission([PERMISSIONS.monitors.delete]),
      this.controller.deleteAllInOrg
    );
  };

  getRouter() {
    return this.router;
  }
}

export default MonitorRoutes;
