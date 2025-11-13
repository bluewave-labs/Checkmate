import { Request, Response, NextFunction } from "express";
import ApiError from "@/utils/ApiError.js";
import RoleService from "@/services/business/RoleService.js";

export interface IRoleController {
  getAll: (req: Request, res: Response, next: NextFunction) => void;
  getTeam: (req: Request, res: Response, next: NextFunction) => void;
  get: (req: Request, res: Response, next: NextFunction) => void;
}

class RoleController implements IRoleController {
  private roleService: RoleService;
  constructor(roleService: RoleService) {
    this.roleService = roleService;
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokenizedUser = req.user;

      if (!tokenizedUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!tokenizedUser.orgId) {
        throw new ApiError("No organization ID", 400);
      }

      const type = req.query.type;

      const roles = await this.roleService.getAll(
        tokenizedUser.orgId,
        type as string
      );
      return res.status(200).json({
        message: "Roles retrieved successfully",
        data: roles,
      });
    } catch (error) {
      next(error);
    }
  };

  getTeam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userContext = req.user;

      if (!userContext) {
        throw new ApiError("Unauthorized", 401);
      }

      const orgId = userContext.orgId;
      if (!orgId) {
        throw new ApiError("No organization ID", 400);
      }

      const teamId = req.params.id;
      if (!teamId) {
        throw new ApiError("No team ID", 400);
      }

      const roles = await this.roleService.getTeam(orgId, teamId);
      return res.status(200).json({
        message: "Roles retrieved successfully",
        data: roles,
      });
    } catch (error) {
      next(error);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
    } catch (error) {
      next(error);
    }
  };
}

export default RoleController;
