import { Request, Response, NextFunction } from "express";
import ApiError from "@/utils/ApiError.js";
import { TeamMemberService } from "@/services/index.js";
import { invalidateCachesForUser } from "@/middleware/AddUserContext.js";

export interface ITeamMemberController {
  create: (req: Request, res: Response, next: NextFunction) => void;
  getAll: (req: Request, res: Response, next: NextFunction) => void;
  get: (req: Request, res: Response, next: NextFunction) => void;
  update: (req: Request, res: Response, next: NextFunction) => void;
  delete: (req: Request, res: Response, next: NextFunction) => void;
}

class TeamMemberController implements ITeamMemberController {
  private teamMemberService: TeamMemberService;
  constructor(teamMemberService: TeamMemberService) {
    this.teamMemberService = teamMemberService;
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userContext = req.user;

      if (!userContext) {
        throw new ApiError("Unauthorized", 401);
      }

      const orgId = userContext.orgId;
      if (!orgId) {
        throw new ApiError("No organization ID", 400);
      }

      const tm = await this.teamMemberService.create(orgId, req.body);
      return res.status(201).json({
        message: "Team member created successfully",
        data: tm,
      });
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userContext = req.user;

      if (!userContext) {
        throw new ApiError("Unauthorized", 401);
      }

      const orgId = userContext.orgId;
      if (!orgId) {
        throw new ApiError("No organization ID", 400);
      }

      const teamId = req.query.teamId as string | undefined;
      const type = req.query.type as string;

      const teamMembers = await this.teamMemberService.getAll(
        orgId,
        teamId,
        type
      );

      return res.status(200).json({
        message: "Team members retrieved successfully",
        data: teamMembers,
      });
    } catch (error) {
      next(error);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userContext = req.user;
      if (!userContext) {
        throw new ApiError("Unauthorized", 401);
      }

      const orgId = userContext.orgId;
      if (!orgId) {
        throw new ApiError("No organization ID", 400);
      }

      const teamMemberId = req.params.id;
      if (!teamMemberId) {
        throw new ApiError("No team member ID", 400);
      }

      const teamMember = await this.teamMemberService.get(orgId, teamMemberId);

      return res
        .status(200)
        .json({ message: "Team retrieved successfully", data: teamMember });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userContext = req.user;
      if (!userContext) {
        throw new ApiError("Unauthorized", 401);
      }

      const orgId = userContext.orgId;
      if (!orgId) {
        throw new ApiError("No organization ID", 400);
      }
      const { roleId } = req.body;
      if (!roleId) {
        throw new ApiError("No role ID provided", 400);
      }

      const teamMembershipId = req.params.id as string;
      if (!teamMembershipId) {
        throw new ApiError("No team membership ID provided", 400);
      }

      await this.teamMemberService.update(orgId, teamMembershipId, roleId);

      return res.status(200).json({
        message: "Team updated successfully",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userContext = req.user;
      if (!userContext) {
        throw new ApiError("Unauthorized", 401);
      }

      const orgId = userContext.orgId;
      if (!orgId) {
        throw new ApiError("No organization ID", 400);
      }

      const teamMemberId = req.params.id;
      if (!req.params.id) {
        throw new ApiError("No team member ID", 400);
      }

      const deleted = await this.teamMemberService.delete(orgId, req.params.id);

      if (!deleted) {
        throw new ApiError("Failed to delete team member", 500);
      }

      return res.status(200).json({
        message: "Team deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}

export default TeamMemberController;
