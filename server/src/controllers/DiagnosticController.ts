import { Request, Response, NextFunction } from "express";
import type { IDiagnosticService } from "@/services/business/DiagnosticService.js";
import type { IJobData } from "@/services/infrastructure/JobQueue.js";

export interface IDiagnosticController {
  getLogs: (req: Request, res: Response, next: NextFunction) => void;
  getJobs(req: Request, res: Response, next: NextFunction): Promise<void>;
}

class DiagnosticController implements IDiagnosticController {
  private diagnosticService: IDiagnosticService;
  constructor(diagnosticService: IDiagnosticService) {
    this.diagnosticService = diagnosticService;
  }

  getLogs = (req: Request, res: Response, next: NextFunction) => {
    try {
      const logs = this.diagnosticService.getLogs();
      res.status(200).json({ message: "OK", data: logs });
    } catch (error) {
      next(error);
    }
  };

  getJobs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const jobs = await this.diagnosticService.getJobs();
      res.status(200).json({ message: "OK", data: jobs });
    } catch (error) {
      next(error);
    }
  };
}

export default DiagnosticController;
