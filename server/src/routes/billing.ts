import { Router } from "express";
import BillingController from "@/controllers/BillingController.js";
import { verifyToken } from "@/middleware/VerifyToken.js";

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
    this.router.post("/subscribe", verifyToken, this.controller.subscribePlan);
  };

  getRouter() {
    return this.router;
  }
}

export default BillingRoutes;
