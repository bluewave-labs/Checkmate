import { QueueController } from "@/controllers/index.js";
import { Router } from "express";

class QueueRoutes {
  private router;
  private controller;
  constructor(queueController: QueueController) {
    this.router = Router();
    this.controller = queueController;
    this.initRoutes();
  }

  initRoutes() {
    this.router.get("/jobs", this.controller.getJobs);
    this.router.get("/metrics", this.controller.getMetrics);
    this.router.post("/flush", this.controller.flush);
  }

  getRouter() {
    return this.router;
  }
}

export default QueueRoutes;
