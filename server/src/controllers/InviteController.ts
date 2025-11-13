import { Request, Response, NextFunction } from "express";
import InviteService from "@/services/business/InviteService.js";
import ApiError from "@/utils/ApiError.js";

class InviteController {
  private inviteService: InviteService;
  constructor(inviteService: InviteService) {
    this.inviteService = inviteService;
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userContext = req.user;

      if (!userContext) {
        throw new ApiError("Unauthorized", 401);
      }

      const userId = userContext.sub;
      if (!userId) {
        throw new ApiError("No user ID in context", 400);
      }

      const orgId = userContext.orgId;
      if (!orgId) {
        throw new ApiError("No organization ID", 400);
      }

      const { email, orgRoleId, teamId, teamRoleId } = req.body;

      const invite = await this.inviteService.create(
        userId,
        email,
        orgId,
        orgRoleId,
        teamId,
        teamRoleId
      );
      res.status(201).json({ message: "OK", data: invite });
    } catch (error: any) {
      next(error);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invites = await this.inviteService.getAll();
      res.status(200).json({
        message: "OK",
        data: invites,
      });
    } catch (error) {
      next(error);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.params.id;
      if (!token) {
        return res.status(400).json({ message: "Token parameter is required" });
      }
      const result = await this.inviteService.get(token);
      res.status(200).json({ message: "OK", data: result });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ message: "ID parameter is required" });
      }
      await this.inviteService.delete(id);
      res.status(200).json({ message: "OK" });
    } catch (error: any) {
      next(error);
    }
  };
}

export default InviteController;
