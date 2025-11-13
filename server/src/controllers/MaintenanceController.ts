import { Request, Response, NextFunction } from "express";
import MaintenanceService from "@/services/business/MaintenanceService.js";
import ApiError from "@/utils/ApiError.js";
class MaintenanceController {
  private maintenanceService: MaintenanceService;
  constructor(maintenanceService: MaintenanceService) {
    this.maintenanceService = maintenanceService;
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokenizedUser = req.user;
      if (!tokenizedUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const maintenance = await this.maintenanceService.create(
        tokenizedUser,
        req.body
      );
      res.status(201).json({ message: "OK", data: maintenance });
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

      const maintenances = await this.maintenanceService.getAll(teamId);
      res.status(200).json({
        message: "OK",
        data: maintenances,
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
      const maintenance = await this.maintenanceService.toggleActive(
        teamId,
        tokenizedUser,
        id
      );
      res.status(200).json({ message: "OK", data: maintenance });
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
      const updatedMaintenance = await this.maintenanceService.update(
        teamId,
        tokenizedUser,
        id,
        req.body
      );
      res.status(200).json({ message: "OK", data: updatedMaintenance });
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
      const maintenance = await this.maintenanceService.get(teamId, id);
      res.status(200).json({ message: "OK", data: maintenance });
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
      await this.maintenanceService.delete(teamId, id);
      res.status(200).json({ message: "OK" });
    } catch (error) {
      next(error);
    }
  };
}

export default MaintenanceController;
