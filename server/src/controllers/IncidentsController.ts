import { Request, Response, NextFunction } from "express";
import ApiError from "@/utils/ApiError.js";
import {
  IncidentService,
  NotificationService,
  MonitorService,
} from "@/services/index.js";
import { getChildLogger } from "@/logger/Logger.js";
const logger = getChildLogger("IncidentController");

export interface IIncidentsController {
  getIncidents: (req: Request, res: Response, next: NextFunction) => void;
  resolveIncident: (req: Request, res: Response, next: NextFunction) => void;
}

class IncidentsController implements IIncidentsController {
  private incidentService: IncidentService;
  private notificationService: NotificationService;
  private monitorService: MonitorService;
  constructor(
    incidentService: IncidentService,
    notificationService: NotificationService,
    monitorService: MonitorService
  ) {
    this.incidentService = incidentService;
    this.notificationService = notificationService;
    this.monitorService = monitorService;
  }

  getIncidents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userContext = req.user;
      if (!userContext) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const teamId = userContext.currentTeamId;
      if (!teamId) {
        throw new ApiError("No team ID", 400);
      }

      const { resolved, resolutionType, page, rowsPerPage, range, monitorId } =
        req.validatedQuery;

      const incidents = await this.incidentService.getAll(
        teamId,
        monitorId,
        page,
        rowsPerPage,
        range,
        resolved,
        resolutionType
      );

      res.status(200).json({ message: "OK", data: incidents });
    } catch (error) {
      next(error);
    }
  };

  resolveIncident = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userContext = req.user;
      if (!userContext) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const teamId = userContext.currentTeamId;
      if (!teamId) {
        throw new ApiError("No team ID", 400);
      }

      const { id } = req.params;
      if (!id) {
        throw new ApiError("No incident ID", 400);
      }

      const { resolutionNote } = req.body;

      const resolved = await this.incidentService.resolve(
        teamId,
        id,
        "manual",
        undefined,
        userContext.sub,
        resolutionNote
      );

      if (!resolved) {
        throw new ApiError("Incident not found or could not be resolved", 500);
      }

      // This should be best effort only, don't wait and don't fail
      this.monitorService
        .get(teamId, resolved.monitorId.toString())
        .then((monitor) => {
          this.notificationService.handleNotifications(monitor, resolved);
        })
        .catch((error) => {
          logger.warn(error);
        });

      return res
        .status(200)
        .json({ message: "Incident resolved", data: resolved });
    } catch (error) {
      next(error);
    }
  };
}

export default IncidentsController;
