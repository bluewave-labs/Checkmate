import { Request, Response, NextFunction } from "express";
import StatusPageService from "@/services/business/StatusPageService.js";
import ApiError from "@/utils/ApiError.js";
class StatusPageController {
  private statusPageService: StatusPageService;
  constructor(statusPageService: StatusPageService) {
    this.statusPageService = statusPageService;
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userContext = req.user;
      if (!userContext) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const statusPage = await this.statusPageService.create(
        userContext,
        req.body
      );
      res.status(201).json({ message: "OK", data: statusPage });
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userContext = req.user;
      if (!userContext) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const teamId = userContext.currentTeamId;
      if (!teamId) {
        throw new ApiError("No team ID", 400);
      }

      const statusPages = await this.statusPageService.getAll(teamId);
      res.status(200).json({
        message: "OK",
        data: statusPages,
      });
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

      const teamId = userContext.currentTeamId;
      if (!teamId) {
        throw new ApiError("No team ID", 400);
      }

      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ message: "ID parameter is required" });
      }
      const updatedChannel = await this.statusPageService.update(
        teamId,
        userContext,
        id,
        req.body
      );
      res.status(200).json({ message: "OK", data: updatedChannel });
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

      const teamId = userContext.currentTeamId;
      if (!teamId) {
        throw new ApiError("No team ID", 400);
      }

      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ message: "ID parameter is required" });
      }
      const statusPage = await this.statusPageService.get(teamId, id);
      res.status(200).json({ message: "OK", data: statusPage });
    } catch (error) {
      next(error);
    }
  };

  getPublic = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const url = req.params.url;
      if (!url) {
        throw new ApiError("No URL parameter", 400);
      }

      const statusPage = await this.statusPageService.getPublic(url);
      res.status(200).json({ message: "OK", data: statusPage });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userContext = req.user;
      if (!userContext) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const teamId = userContext.currentTeamId;
      if (!teamId) {
        throw new ApiError("No team ID", 400);
      }

      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ message: "ID parameter is required" });
      }
      await this.statusPageService.delete(teamId, id);
      res.status(200).json({ message: "OK" });
    } catch (error) {
      next(error);
    }
  };
}

export default StatusPageController;
