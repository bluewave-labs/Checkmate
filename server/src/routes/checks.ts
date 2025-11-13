import { Router } from "express";

import { ChecksController } from "@/controllers/index.js";
import { verifyToken } from "@/middleware/VerifyToken.js";
import { addUserContext } from "@/middleware/AddUserContext.js";
import { validateQuery } from "@/middleware/validation.js";
import { verifyOrgPermission } from "@/middleware/VerifyPermission.js";
import { PERMISSIONS } from "@/services/business/AuthService.js";
import { checksStatusIdQuerySchema } from "@/validation/index.js";

class CheckRoutes {
  private controller: ChecksController;
  private router: Router;
  constructor(checksController: ChecksController) {
    this.controller = checksController;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes = () => {
    this.router.get(
      "/",
      verifyToken,
      addUserContext,
      verifyOrgPermission([PERMISSIONS.checks.read]),
      validateQuery(checksStatusIdQuerySchema),
      this.controller.getChecksByStatus
    );
  };

  getRouter() {
    return this.router;
  }
}

export default CheckRoutes;
