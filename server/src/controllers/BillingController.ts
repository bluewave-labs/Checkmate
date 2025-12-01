import type { Request, Response, NextFunction } from "express";
import BillingService, {
  type IBillingService,
} from "@/services/system/BillingService.js";

export interface IBillingController {
  listPlans: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  subscribePlan: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void>;
}

class BillingController implements IBillingController {
  private billingService: IBillingService;
  constructor(billingService: IBillingService) {
    this.billingService = billingService;
  }

  listPlans = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const plans = await this.billingService.listPlans();
      res.json({ message: "OK", data: plans });
    } catch (error) {
      next(error);
    }
  };

  subscribePlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        message: "OK",
        data: { redirectUrl: "https://www.google.com" },
      });
    } catch (error) {
      next(error);
    }
  };
}

export default BillingController;
