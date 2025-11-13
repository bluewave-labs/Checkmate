import { Router } from "express";

import { RoleController } from "@/controllers/index.js";
import { verifyToken } from "@/middleware/VerifyToken.js";
import { addUserContext } from "@/middleware/AddUserContext.js";
import { verifyOrgPermission } from "@/middleware/VerifyPermission.js";
import { PERMISSIONS } from "@/services/business/AuthService.js";

class RoleRoutes {
  private controller: RoleController;
  private router: Router;
  constructor(roleController: RoleController) {
    this.controller = roleController;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes = () => {
    this.router.get(
      "/",
      verifyToken,
      addUserContext,
      verifyOrgPermission([PERMISSIONS.roles.read]),
      this.controller.getAll
    );
    this.router.get(
      "/team/:id",
      verifyToken,
      addUserContext,
      verifyOrgPermission([PERMISSIONS.roles.read]),
      this.controller.getTeam
    );

    this.router.get(
      "/:id",
      verifyToken,
      addUserContext,
      verifyOrgPermission([PERMISSIONS.roles.read]),
      this.controller.get
    );
  };

  getRouter() {
    return this.router;
  }
}

export default RoleRoutes;
