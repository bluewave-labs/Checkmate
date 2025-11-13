import { IIncident, Incident, IMonitor, ICheck } from "@/db/models/index.js";
import type { ResolutionType } from "@/db/models/index.js";
import mongoose from "mongoose";
import { getChildLogger } from "@/logger/Logger.js";
import ApiError from "@/utils/ApiError.js";

export interface IIncidentService {
  handleStatusChange: (
    updatedMonitor: IMonitor,
    lastCheck: ICheck
  ) => Promise<IIncident | null>;
  create: (
    teamId: mongoose.Types.ObjectId,
    monitorId: mongoose.Types.ObjectId,
    startCheckId: mongoose.Types.ObjectId
  ) => Promise<IIncident>;
  get: (
    teamId: mongoose.Types.ObjectId,
    incidentId: mongoose.Types.ObjectId
  ) => Promise<IIncident | null>;
  getAll: (
    teamId: string,
    monitorId: string,
    page: number,
    rowsPerPage: number,
    range: string,
    resolved?: boolean,
    resolutionType?: ResolutionType
  ) => Promise<{ incidents: IIncident[]; count: number }>;
  resolve: (
    teamId: string,
    incidentId: string,
    resolutionType: ResolutionType,
    lastCheck?: ICheck,
    resolvedBy?: string,
    resolutionNote?: string
  ) => Promise<IIncident | null>;
  delete: (
    teamId: mongoose.Types.ObjectId,
    incidentId: mongoose.Types.ObjectId
  ) => Promise<boolean>;
}

const SERVICE_NAME = "IncidentService";

class IncidentService implements IIncidentService {
  public SERVICE_NAME: string;
  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
  }

  private getStartDate(range: string): Date {
    const now = new Date();
    switch (range) {
      case "2h":
        return new Date(now.getTime() - 2 * 60 * 60 * 1000);
      case "24h":
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case "7d":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "30d":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        throw new ApiError("Invalid range parameter", 400);
    }
  }

  handleStatusChange = async (updatedMonitor: IMonitor, lastCheck: ICheck) => {
    if (updatedMonitor.status === "down") {
      const incident = await this.create(
        updatedMonitor.teamId,
        updatedMonitor._id,
        lastCheck._id
      );
      return incident;
    } else if (updatedMonitor.status === "up") {
      const incident = await Incident.findOne({
        monitorId: updatedMonitor._id,
        teamId: updatedMonitor.teamId,
        resolved: false,
      });

      if (!incident) {
        return null;
      }

      const resolvedIncident = await this.resolve(
        updatedMonitor.teamId.toString(),
        incident._id.toString(),
        "auto",
        lastCheck
      );
      return resolvedIncident;
    }
    return null;
  };

  create = async (
    teamId: mongoose.Types.ObjectId,
    monitorId: mongoose.Types.ObjectId,
    startCheckId: mongoose.Types.ObjectId
  ) => {
    const existing = await Incident.findOne({
      monitorId,
      teamId,
      resolved: false,
    });

    if (existing) {
      return existing;
    }

    let data: Partial<IIncident> = {
      teamId: new mongoose.Types.ObjectId(teamId),
      monitorId: new mongoose.Types.ObjectId(monitorId),
      startedAt: new Date(),
      startCheck: new mongoose.Types.ObjectId(startCheckId),
    };
    const incident = await Incident.create(data);
    return incident;
  };

  get = async (
    teamId: mongoose.Types.ObjectId,
    incidentId: mongoose.Types.ObjectId
  ) => {
    const incident = await Incident.findOne({
      _id: new mongoose.Types.ObjectId(incidentId),
      teamId: new mongoose.Types.ObjectId(teamId),
    })
      .populate("monitorId")
      .populate("resolvedBy");
    return incident;
  };

  getAll = async (
    teamId: string,
    monitorId: string,
    page: number,
    rowsPerPage: number,
    range: string,
    resolved?: boolean,
    resolutionType?: ResolutionType
  ) => {
    const startDate = this.getStartDate(range);
    const match = {
      teamId: teamId,
      ...(monitorId && { monitorId }),
      createdAt: { $gte: startDate },
      ...(resolved !== undefined && { resolved }),
      ...(resolutionType !== undefined && { resolutionType }),
    };

    const [count, incidents] = await Promise.all([
      Incident.countDocuments(match),
      Incident.find(match)
        .populate("monitorId")
        .populate("resolvedBy")
        .sort({ createdAt: -1 })
        .skip(page * rowsPerPage)
        .limit(rowsPerPage),
    ]);
    return { count, incidents };
  };

  resolve = async (
    teamId: string,
    incidentId: string,
    resolutionType: ResolutionType,
    lastCheck?: ICheck,
    resolvedBy?: string,
    resolutionNote?: string
  ) => {
    const incident = await Incident.findOneAndUpdate(
      { _id: incidentId, teamId, resolved: false },
      {
        $set: {
          resolved: true,
          endedAt: new Date(),
          endCheck: lastCheck ? lastCheck._id : undefined,
          resolvedBy: resolvedBy ? resolvedBy : undefined,
          resolutionType,
          resolutionNote: resolutionNote ? resolutionNote : undefined,
        },
      },
      { new: true }
    );

    return incident;
  };

  delete = async (
    teamId: mongoose.Types.ObjectId,
    incidentId: mongoose.Types.ObjectId
  ) => {
    const result = await Incident.deleteOne({
      _id: new mongoose.Types.ObjectId(incidentId),
      teamId: new mongoose.Types.ObjectId(teamId),
    });
    return result.deletedCount === 1;
  };
}

export default IncidentService;
