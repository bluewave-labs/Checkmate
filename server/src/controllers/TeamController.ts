import { Request, Response, NextFunction } from "express";
import ApiError from "@/utils/ApiError.js";
import TeamService from "@/services/business/TeamService.js";

export interface ITeamController {
  create: (req: Request, res: Response, next: NextFunction) => void;
  getOrg: (req: Request, res: Response, next: NextFunction) => void;
  getJoined: (req: Request, res: Response, next: NextFunction) => void;
  get: (req: Request, res: Response, next: NextFunction) => void;
  update: (req: Request, res: Response, next: NextFunction) => void;
  delete: (req: Request, res: Response, next: NextFunction) => void;
}

class TeamController implements ITeamController {
  private teamService: TeamService;
  constructor(teamService: TeamService) {
    this.teamService = teamService;
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userContext = req.user;
      if (!userContext) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const orgId = userContext.orgId;
      if (!orgId) {
        throw new ApiError("No organization ID", 400);
      }

      const userId = userContext.sub;
      if (!userId) {
        throw new ApiError("No user ID", 400);
      }

      const roleId = req.body.roleId;
      if (!roleId) {
        throw new ApiError("No role ID", 400);
      }

      await this.teamService.create(orgId, userId, req.body, roleId);

      return res.status(201).json({
        message: "Team created successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  getOrg = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userContext = req.user;
      if (!userContext) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = userContext.sub;
      if (!userId) {
        throw new ApiError("No user ID", 400);
      }

      const orgId = userContext.orgId;
      if (!orgId) {
        throw new ApiError("No organization ID", 400);
      }

      const teams = await this.teamService.getOrg(orgId);

      return res
        .status(200)
        .json({ message: "Teams retrieved successfully", data: teams });
    } catch (error) {
      next(error);
    }
  };

  getJoined = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userContext = req.user;
      if (!userContext) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = userContext.sub;
      if (!userId) {
        throw new ApiError("No user ID", 400);
      }

      const orgId = userContext.orgId;
      if (!orgId) {
        throw new ApiError("No organization ID", 400);
      }

      const teams = await this.teamService.getJoined(orgId, userId);

      return res
        .status(200)
        .json({ message: "Teams retrieved successfully", data: teams });
    } catch (error) {
      next(error);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userContext = req.user;
      if (!userContext) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const teamId = req.params.id;
      if (!teamId) {
        throw new ApiError("No team ID", 400);
      }

      const orgId = userContext.orgId;
      if (!orgId) {
        throw new ApiError("No organization ID", 400);
      }

      const team = await this.teamService.get(teamId, orgId);
      return res
        .status(200)
        .json({ message: "Team retrieved successfully", data: team });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userContext = req.user;
      if (!userContext) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = req.params.id;
      if (!id) {
        throw new ApiError("Monitor ID is required", 400);
      }

      const result = await this.teamService.update(userContext, id, req.body);
      return res.status(200).json({
        message: "Team updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const teamId = req.params.id;
      if (!teamId) {
        throw new ApiError("No team ID", 400);
      }

      const userContext = req.user;
      if (!userContext) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const success = await this.teamService.delete(userContext.orgId, teamId);
      if (!success) {
        throw new ApiError("Failed to delete team", 500);
      }
      return res.status(200).json({
        message: "Team deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}

export default TeamController;
