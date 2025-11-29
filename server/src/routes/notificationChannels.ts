import { NotificationChannel } from "@/db/models/index.js";
import { Router } from "express";
import { NotificationChannelController } from "@/controllers/index.js";
import { verifyToken } from "@/middleware/VerifyToken.js";
import { verifyTeamPermission } from "@/middleware/VerifyPermission.js";
import { addUserContext } from "@/middleware/AddUserContext.js";
import { PERMISSIONS } from "@/services/business/AuthService.js";
import { validateBody } from "@/middleware/validation.js";
import { enforceMax, requireFeature } from "@/middleware/VerifyEntitlements.js";
import {
  notificationChannelSchema,
  notificationPatchSchema,
} from "@/validation/index.js";
import type { Request } from "express";
class NotificationChannelRoutes {
  private router;
  private controller;
  constructor(notificationChannelController: NotificationChannelController) {
    this.router = Router();
    this.controller = notificationChannelController;
    this.initRoutes();
  }

  initRoutes = () => {
    this.router.post(
      "/",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.notifications.write]),
      requireFeature("notificationsEnabled"),
      enforceMax("notificationChannelsMax", async (req: Request) =>
        NotificationChannel.countDocuments({ orgId: req?.user?.orgId })
      ),
      validateBody(notificationChannelSchema),
      this.controller.create
    );

    this.router.get(
      "/",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.notifications.read]),
      this.controller.getAll
    );

    this.router.patch(
      "/:id/active",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.notifications.write]),
      requireFeature("notificationsEnabled"),
      this.controller.toggleActive
    );

    this.router.patch(
      "/:id",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.notifications.update]),
      requireFeature("notificationsEnabled"),
      validateBody(notificationPatchSchema),
      this.controller.update
    );

    this.router.get(
      "/:id",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.notifications.read]),
      this.controller.get
    );

    this.router.delete(
      "/:id",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.notifications.delete]),
      this.controller.delete
    );
    this.router.post(
      "/test",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.notifications.write]),
      requireFeature("notificationsEnabled"),
      validateBody(notificationChannelSchema),
      this.controller.test
    );
  };

  getRouter() {
    return this.router;
  }
}

export default NotificationChannelRoutes;
