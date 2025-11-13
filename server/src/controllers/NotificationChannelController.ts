import { Request, Response, NextFunction } from "express";
import NotificationChannelService from "@/services/business/NotificationChannelService.js";
import { NotificationService } from "@/services/index.js";
import ApiError from "@/utils/ApiError.js";
class NotificationChannelController {
  private notificationChannelService: NotificationChannelService;
  private notificationService: NotificationService;
  constructor(
    notificationChannelService: NotificationChannelService,
    notificationService: NotificationService
  ) {
    this.notificationChannelService = notificationChannelService;
    this.notificationService = notificationService;
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokenizedUser = req.user;
      if (!tokenizedUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const channel = await this.notificationChannelService.create(
        tokenizedUser,
        req.body
      );
      res.status(201).json({ message: "OK", data: channel });
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokenizedUser = req.user;
      if (!tokenizedUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const teamId = tokenizedUser.currentTeamId;
      if (!teamId) {
        throw new ApiError("No team ID", 400);
      }

      const notificationChannels = await this.notificationChannelService.getAll(
        teamId
      );
      res.status(200).json({
        message: "OK",
        data: notificationChannels,
      });
    } catch (error) {
      next(error);
    }
  };

  toggleActive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokenizedUser = req.user;
      if (!tokenizedUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const teamId = tokenizedUser.currentTeamId;
      if (!teamId) {
        throw new ApiError("No team ID", 400);
      }

      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ message: "ID parameter is required" });
      }
      const notificationChannel =
        await this.notificationChannelService.toggleActive(
          teamId,
          tokenizedUser,
          id
        );
      res.status(200).json({ message: "OK", data: notificationChannel });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokenizedUser = req.user;
      if (!tokenizedUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const teamId = tokenizedUser.currentTeamId;
      if (!teamId) {
        throw new ApiError("No team ID", 400);
      }

      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ message: "ID parameter is required" });
      }
      const updatedChannel = await this.notificationChannelService.update(
        teamId,
        tokenizedUser,
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
      const tokenizedUser = req.user;
      if (!tokenizedUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const teamId = tokenizedUser.currentTeamId;
      if (!teamId) {
        throw new ApiError("No team ID", 400);
      }

      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ message: "ID parameter is required" });
      }
      const notificationChannel = await this.notificationChannelService.get(
        teamId,
        id
      );
      res.status(200).json({ message: "OK", data: notificationChannel });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokenizedUser = req.user;
      if (!tokenizedUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const teamId = tokenizedUser.currentTeamId;
      if (!teamId) {
        throw new ApiError("No team ID", 400);
      }

      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ message: "ID parameter is required" });
      }
      await this.notificationChannelService.delete(teamId, id);
      res.status(200).json({ message: "OK" });
    } catch (error) {
      next(error);
    }
  };

  test = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notificationChannel = req.body;
      const success = await this.notificationService.testNotificationChannel(
        notificationChannel
      );
      if (success) {
        res.status(200).json({ message: "OK" });
      } else {
        throw new ApiError("Failed to send", 500);
      }
    } catch (error) {
      next(error);
    }
  };
}

export default NotificationChannelController;
