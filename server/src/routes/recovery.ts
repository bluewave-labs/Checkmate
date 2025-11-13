import { Router } from "express";
import { RecoveryController } from "@/controllers/index.js";
import { validateBody } from "@/middleware/validation.js";
import { recoverySchema, resetPasswordSchema } from "@/validation/index.js";
class RecoveryRoutes {
  private router;
  private controller;
  constructor(recoveryController: RecoveryController) {
    this.router = Router();
    this.controller = recoveryController;
    this.initRoutes();
  }

  initRoutes = () => {
    this.router.post(
      "/",
      validateBody(recoverySchema),
      this.controller.requestRecovery
    );

    this.router.post(
      "/reset",
      validateBody(resetPasswordSchema),
      this.controller.resetPassword
    );
  };

  getRouter() {
    return this.router;
  }
}

export default RecoveryRoutes;
