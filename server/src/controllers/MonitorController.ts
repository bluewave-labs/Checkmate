import { Request, Response, NextFunction } from "express";
import ApiError from "@/utils/ApiError.js";
import { MonitorType } from "@/db/models/monitors/Monitor.js";
import {
  MonitorService,
  CheckService,
  NotificationService,
} from "@/services/index.js";

export interface IMonitorController {
  create(req: Request, res: Response, next: NextFunction): Promise<void>;
  getAll(req: Request, res: Response, next: NextFunction): Promise<void>;
  getChecks(req: Request, res: Response, next: NextFunction): Promise<void>;
  toggleActive(req: Request, res: Response, next: NextFunction): Promise<void>;
  get(req: Request, res: Response, next: NextFunction): Promise<void>;
  update(req: Request, res: Response, next: NextFunction): Promise<void>;
  delete(req: Request, res: Response, next: NextFunction): Promise<void>;
  testNotifications(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>;
}
class MonitorController {
  private monitorService: MonitorService;
  private checkService: CheckService;
  private notificationService: NotificationService;
  constructor(
    monitorService: MonitorService,
    checkService: CheckService,
    notificationService: NotificationService
  ) {
    this.monitorService = monitorService;
    this.checkService = checkService;
    this.notificationService = notificationService;
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userContext = req.user;
      if (!userContext) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!userContext.currentTeamId) {
        throw new ApiError("No team ID", 400);
      }

      const monitor = await this.monitorService.create(
        userContext.orgId,
        userContext.sub,
        userContext.currentTeamId,
        req.body
      );

      res.status(201).json({
        message: "Monitor created successfully",
        data: monitor,
      });
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

      let result;
      if (req.validatedQuery.embedChecks === true) {
        const page = req.validatedQuery.page || 0;
        const rowsPerPage = req.validatedQuery.rowsPerPage || 10;
        const type = req.validatedQuery.type;

        result = await this.monitorService.getAllEmbedChecks(
          teamId,
          page,
          rowsPerPage,
          type
        );
      } else {
        result = await this.monitorService.getAll(teamId);
      }

      res.status(200).json({
        message: "Monitors retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getChecks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userContext = req.user;
      if (!userContext) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const teamId = userContext.currentTeamId;
      if (!teamId) {
        throw new ApiError("No team ID", 400);
      }

      const monitorId = req.params.id;
      if (!monitorId) {
        throw new ApiError("Monitor ID is required", 400);
      }

      const monitor = await this.monitorService.get(teamId, monitorId);
      if (!monitor) {
        throw new ApiError("Monitor not found", 404);
      }

      const page = Number(req.validatedQuery.page);
      const rowsPerPage = Number(req.validatedQuery.rowsPerPage);

      const { count, checks } = await this.checkService.getMonitorChecks(
        monitorId,
        page,
        rowsPerPage
      );
      res.status(200).json({
        message: "Checks retrieved successfully",
        data: { count, checks },
      });
    } catch (error) {
      next(error);
    }
  };

  toggleActive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userContext = req.user;
      if (!userContext) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const teamId = userContext.currentTeamId;
      if (!teamId) {
        throw new ApiError("No team ID", 400);
      }

      const monitorId = req.params.id;
      if (!monitorId) {
        throw new ApiError("Monitor ID is required", 400);
      }

      const monitor = await this.monitorService.toggleActive(
        userContext.sub,
        teamId,
        monitorId
      );

      const paused = monitor.isActive ? "resumed" : "paused";

      res.status(200).json({
        message: `Monitor ${paused} successfully`,
        data: monitor,
      });
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

      const monitorId = req.params.id;
      if (!monitorId) {
        throw new ApiError("Monitor ID is required", 400);
      }

      let monitor;

      const status = req.query.status;
      if (status && typeof status !== "string") {
        throw new ApiError("Status query parameter must be a string", 400);
      }

      if (req.query.embedChecks === "true") {
        const range = req.query.range;
        if (!range || typeof range !== "string")
          throw new ApiError("Range query parameter is required", 400);

        monitor = await this.monitorService.getEmbedChecks(
          teamId,
          monitorId,
          range,
          status
        );
      } else {
        monitor = await this.monitorService.get(teamId, monitorId);
      }

      res.status(200).json({
        message: "Monitor retrieved successfully",
        data: monitor,
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

      const monitorId = req.params.id;
      if (!monitorId) {
        throw new ApiError("Monitor ID is required", 400);
      }

      const monitor = await this.monitorService.update(
        userContext.sub,
        teamId,
        monitorId,
        req.body
      );
      res.status(200).json({
        message: "Monitor updated successfully",
        data: monitor,
      });
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
        throw new ApiError("Monitor ID is required", 400);
      }
      await this.monitorService.delete(teamId, id);

      res.status(200).json({
        message: "Monitor deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  testNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const tokenizedUser = req.user;
      if (!tokenizedUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const teamId = tokenizedUser.currentTeamId;
      if (!teamId) {
        throw new ApiError("No team ID", 400);
      }

      const monitorId = req.params.id;
      if (!monitorId) {
        throw new ApiError("Monitor ID is required", 400);
      }

      const results = await this.notificationService.testNotificationChannels(
        monitorId,
        teamId
      );
      return res.status(200).json({
        message: "Notification test sent successfully",
        data: results,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default MonitorController;
