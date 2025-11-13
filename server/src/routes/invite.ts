import { Router } from "express";
import { InviteController } from "@/controllers/index.js";
import { verifyToken } from "@/middleware/VerifyToken.js";
import { verifyOrgPermission } from "@/middleware/VerifyPermission.js";
import { addUserContext } from "@/middleware/AddUserContext.js";
import { PERMISSIONS } from "@/services/business/AuthService.js";
import { validateBody } from "@/middleware/validation.js";
import { inviteSchema } from "@/validation/index.js";
class InviteRoutes {
  private router;
  private controller;
  constructor(inviteController: InviteController) {
    this.router = Router();
    this.controller = inviteController;
    this.initRoutes();
  }

  initRoutes = () => {
    this.router.post(
      "/",
      verifyToken,
      addUserContext,
      validateBody(inviteSchema),
      verifyOrgPermission([PERMISSIONS.invite.write]),
      this.controller.create
    );

    this.router.get(
      "/",
      verifyToken,
      addUserContext,
      verifyOrgPermission([PERMISSIONS.invite.read]),
      this.controller.getAll
    );

    this.router.get("/:id", verifyToken, this.controller.get);

    this.router.delete(
      "/:id",
      verifyToken,
      addUserContext,
      verifyOrgPermission([PERMISSIONS.invite.delete]),
      this.controller.delete
    );
  };

  getRouter() {
    return this.router;
  }
}

export default InviteRoutes;
