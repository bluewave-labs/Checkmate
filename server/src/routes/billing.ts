import { Router } from "express";
import BillingController from "@/controllers/BillingController.js";
import { verifyToken } from "@/middleware/VerifyToken.js";
import { validateBody } from "@/middleware/validation.js";
import { subscribePlanSchema } from "@/validation/index.js";
import { verifyOrgPermission } from "@/middleware/VerifyPermission.js";
import { PERMISSIONS } from "@/types/permissions.js";
import { addUserContext } from "@/middleware/AddUserContext.js";

class BillingRoutes {
  private router;
  private controller;
  constructor(controller: BillingController) {
    this.router = Router();
    this.controller = controller;
    this.initRoutes();
  }

  initRoutes = () => {
    this.router.get("/plans", verifyToken, this.controller.listPlans);
    this.router.post(
      "/subscribe",
      verifyToken,
      addUserContext,
      verifyOrgPermission([PERMISSIONS.billing.all]),
      validateBody(subscribePlanSchema),
      this.controller.subscribePlan
    );
    this.router.post(
      "/cancel",
      verifyToken,
      addUserContext,
      this.controller.cancelPlan
    );
    this.router.get(
      "/confirm",
      verifyToken,
      addUserContext,
      this.controller.confirmPlan
    );
  };

  getRouter() {
    return this.router;
  }
}

export default BillingRoutes;
