import { Request, Response, NextFunction } from "express";
import ApiError from "@/utils/ApiError.js";
import { NotificationService, SettingsService } from "@/services/index.js";

export interface ISettingsController {
  get: (req: Request, res: Response, next: NextFunction) => void;
  update: (req: Request, res: Response, next: NextFunction) => void;
  testTransport: (req: Request, res: Response, next: NextFunction) => void;
}

class SettingsController implements ISettingsController {
  private settingsService: SettingsService;
  private notificationService: NotificationService;
  constructor(
    settingsService: SettingsService,
    notificationService: NotificationService
  ) {
    this.settingsService = settingsService;
    this.notificationService = notificationService;
  }

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const settings = await this.settingsService.get();
      res.status(200).json({
        message: "Settings retrieved successfully",
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updatedSettings = await this.settingsService.update(req.body);
      res.status(200).json({
        message: "Settings updated successfully",
        data: updatedSettings,
      });
    } catch (error) {
      next(error);
    }
  };

  testTransport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const testResult = await this.notificationService.testEmailTransport(
        req.body
      );

      res.status(200).json({
        message: "Test transport successful",
        data: testResult,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default SettingsController;
