import { Request, Response, NextFunction } from "express";
import QueueService from "@/services/business/QueueService.js";
class QueueController {
  private queueService: QueueService;
  constructor(queueService: QueueService) {
    this.queueService = queueService;
  }

  getJobs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const jobs = await this.queueService.getJobs();
      res.status(200).json({ message: "ok", data: jobs });
    } catch (error) {
      next(error);
    }
  };

  getMetrics = async (req: Request, res: Response, next: NextFunction) => {
    const metrics = await this.queueService.getMetrics();
    res.status(200).json({ message: "ok", data: metrics });
  };

  flush = async (req: Request, res: Response, next: NextFunction) => {
    const result = await this.queueService.flush();
    res.status(200).json({ message: "ok", flushed: result });
  };
}

export default QueueController;
