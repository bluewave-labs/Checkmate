import type { Request, Response, NextFunction } from "express";
import { type IBillingService } from "@/services/system/BillingService.js";
import { type PlanKey } from "@/types/entitlements.js";
import ApiError from "@/utils/ApiError.js";

export interface IBillingController {
  listPlans: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  subscribePlan: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void>;
  confirmPlan: (
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
      const user = req.user;
      if (!user) throw new ApiError("Unauthorized", 401);

      const orgId = req.user?.orgId;
      if (!orgId) throw new ApiError("Organization not found", 404);

      const planKey: PlanKey | undefined = req.body.planKey;

      const redirectUrl = await this.billingService.subscribePlan(
        user.email,
        orgId,
        planKey!
      );

      res.status(200).json({
        message: "Subscription initiation successful",
        data: { redirectUrl },
      });
      return;
    } catch (error) {
      next(error);
    }
  };

  cancelPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user?.orgId;
      if (!orgId) throw new ApiError("Organization not found", 404);

      const redirectUrl = await this.billingService.cancelSubscription(orgId);

      res.status(200).json({
        message: "Subscription cancellation successful",
        data: { redirectUrl },
      });
      return;
    } catch (error) {
      next(error);
    }
  };

  confirmPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user?.orgId;
      if (!orgId) throw new ApiError("Organization not found", 404);

      const expectedPlanKey = req.query.plan as PlanKey;
      const success = await this.billingService.confirmPlan(
        orgId,
        expectedPlanKey
      );

      res.status(200).json({
        message: "Plan confirmation endpoint hit",
        data: { success },
      });
      return;
    } catch (error) {
      next(error);
    }
  };
}

export default BillingController;
