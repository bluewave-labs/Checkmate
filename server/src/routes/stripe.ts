import { Router, raw } from "express";
import StripeController from "@/controllers/StripeController.js";

// Note: webhook route must be mounted with express.raw at app/init level.
class StripeRoutes {
  private router;
  private controller;
  constructor(stripeController: StripeController) {
    this.router = Router();
    this.controller = stripeController;
    this.initRoutes();
  }

  initRoutes = () => {
    this.router.post(
      "/webhook",
      raw({ type: "application/json" }),
      this.controller.webhook
    );
  };

  getRouter() {
    return this.router;
  }
}

export default StripeRoutes;
