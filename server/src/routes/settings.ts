import { Router } from "express";
import { SettingsController } from "@/controllers/index.js";
import { verifyToken } from "@/middleware/VerifyToken.js";
import { verifyTeamPermission } from "@/middleware/VerifyPermission.js";
import { addUserContext } from "@/middleware/AddUserContext.js";
import { PERMISSIONS } from "@/services/business/AuthService.js";
import { validateBody } from "@/middleware/validation.js";
import {
  systemSettingsSchema,
  updateRetentionPolicySchema,
} from "@/validation/index.js";
import { verify } from "node:crypto";
import { FeatureFlags } from "@/utils/FeatureFlags.js";

class SettingsRoutes {
  private router;
  private controller;
  constructor(settingsController: SettingsController) {
    this.router = Router();
    this.controller = settingsController;
    this.initRoutes();
  }

  initRoutes = () => {
    this.router.get(
      "/",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.master]),
      this.controller.get
    );

    this.router.patch(
      "/email",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.master]),
      validateBody(systemSettingsSchema),
      this.controller.updateEmailSettings
    );
    this.router.patch(
      "/retention",
      verifyToken,
      addUserContext,
      verifyTeamPermission(FeatureFlags.getSetRetentionPermission()),
      validateBody(updateRetentionPolicySchema),
      this.controller.updateRetentionPolicy
    );
    this.router.post(
      "/test-transport",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.master]),
      validateBody(systemSettingsSchema),
      this.controller.testTransport
    );
  };

  getRouter() {
    return this.router;
  }
}

export default SettingsRoutes;
