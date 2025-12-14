import { Request, Response, NextFunction } from "express";
import type { IMeService } from "@/services/business/MeService.js";
import ApiError from "@/utils/ApiError.js";

export interface IMeController {
  me: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getEntitlements: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void>;
  getPermissions: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void>;
}

class MeController implements IMeController {
  private meService: IMeService;

  constructor(meService: IMeService) {
    this.meService = meService;
  }

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        throw new ApiError("Unauthorized", 401);
      }
      const returnableUser = await this.meService.me(user.sub);
      res
        .status(200)
        .json({ message: "User retrieved successfully", data: returnableUser });
    } catch (error) {
      next(error);
    }
  };

  getEntitlements = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user?.orgId;
      if (!orgId) throw new ApiError("Missing org context", 400);
      const entitlements = await this.meService.getEntitlements(orgId);
      res.status(200).json({ message: "OK", data: entitlements });
    } catch (error) {
      next(error);
    }
  };

  getPermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.meService.getPermissions((req as any).user);
      res.status(200).json({ message: "OK", data });
    } catch (error) {
      next(error);
    }
  };
}

export default MeController;
