import { Router } from "express";
import { StatusPageController } from "@/controllers/index.js";
import { verifyToken } from "@/middleware/VerifyToken.js";
import { verifyTeamPermission } from "@/middleware/VerifyPermission.js";
import { addUserContext } from "@/middleware/AddUserContext.js";
import { PERMISSIONS } from "@/services/business/AuthService.js";
import { validateBody } from "@/middleware/validation.js";
import { statusPageSchema } from "@/validation/index.js";

class StatusPageRoutes {
  private router;
  private controller;
  constructor(statusPageController: StatusPageController) {
    this.router = Router();
    this.controller = statusPageController;
    this.initRoutes();
  }

  initRoutes = () => {
    this.router.post(
      "/",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.statusPages.write]),
      validateBody(statusPageSchema),
      this.controller.create
    );

    this.router.get(
      "/",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.statusPages.read]),
      this.controller.getAll
    );

    this.router.patch(
      "/:id",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.statusPages.update]),
      validateBody(statusPageSchema.partial()),
      this.controller.update
    );

    this.router.get(
      "/:id",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.statusPages.read]),
      this.controller.get
    );

    this.router.get("/public/:url", this.controller.getPublic);

    this.router.delete(
      "/:id",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.statusPages.delete]),
      this.controller.delete
    );
  };

  getRouter() {
    return this.router;
  }
}

export default StatusPageRoutes;
