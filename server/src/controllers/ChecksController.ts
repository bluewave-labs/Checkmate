import { Request, Response, NextFunction } from "express";
import ApiError from "@/utils/ApiError.js";
import { CheckService } from "@/services/index.js";

export interface IChecksController {
  getChecksByStatus: (req: Request, res: Response, next: NextFunction) => void;
}

class ChecksController implements IChecksController {
  private checkService: CheckService;
  constructor(checksService: CheckService) {
    this.checkService = checksService;
  }

  getChecksByStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const {
        status,
        monitorId,
        page = 0,
        rowsPerPage = 10,
        range,
      } = req.validatedQuery;

      const userContext = req.user;
      if (!userContext) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const teamId = userContext.currentTeamId;
      if (!teamId) {
        throw new ApiError("No team ID", 400);
      }

      const checks = await this.checkService.getChecksByStatus(
        status,
        teamId,
        monitorId,
        page,
        rowsPerPage,
        range
      );

      return res.status(200).json({
        message: "Checks retrieved successfully",
        data: checks,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default ChecksController;
