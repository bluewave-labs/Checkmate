import { Router } from "express";
import { verifyToken } from "@/middleware/VerifyToken.js";
import { addUserContext } from "@/middleware/AddUserContext.js";
import { MeController } from "@/controllers/index.js";

class MeRoutes {
  private router;
  private controller: MeController;
  constructor(meController: MeController) {
    this.router = Router();
    this.controller = meController;
    this.initRoutes();
  }

  initRoutes = () => {
    this.router.get("/", verifyToken, this.controller.me);
    this.router.get(
      "/entitlements",
      verifyToken,
      addUserContext,
      this.controller.getEntitlements
    );

    this.router.get(
      "/permissions",
      verifyToken,
      addUserContext,
      this.controller.getPermissions
    );
  };

  getRouter() {
    return this.router;
  }
}

export default MeRoutes;
