import {
  IIncident,
  Incident,
  IMonitor,
  Monitor,
  ICheck,
  IUser,
} from "@/db/models/index.js";
import type { ResolutionType } from "@/db/models/index.js";
import mongoose from "mongoose";
import { getChildLogger } from "@/logger/Logger.js";
import ApiError from "@/utils/ApiError.js";
import { ThresholdEvaluationResult } from "@/services/infrastructure/StatusService.js";

type IncidentPopulated = Omit<IIncident, "monitorId" | "resolvedBy"> & {
  monitorId: IMonitor;
  resolvedBy?: IUser | null;
};

export interface IIncidentService {
  handleStatusChange: (
    updatedMonitor: IMonitor,
    lastCheck: ICheck
  ) => Promise<IIncident | null>;
  handleThresholdBreach: (
    updatedMonitor: IMonitor,
    lastCheck: ICheck,
    evalResult: ThresholdEvaluationResult
  ) => Promise<IIncident | null>;
  create: (
    teamId: mongoose.Types.ObjectId,
    monitorId: mongoose.Types.ObjectId,
    startCheckId: mongoose.Types.ObjectId
  ) => Promise<IIncident>;
  createManual: (data: {
    teamId: string;
    monitorId: string;
    startedAt: Date;
    endedAt?: Date;
    resolved?: boolean;
    resolutionType?: ResolutionType;
    resolutionNote?: string;
    resolvedBy?: string;
  }) => Promise<IIncident>;
  updateManual: (
    teamId: string,
    incidentId: string,
    data: Partial<{
      monitorId: string;
      startedAt: Date;
      endedAt: Date | undefined;
      resolved: boolean;
      resolutionType: ResolutionType;
      resolutionNote: string;
      resolvedBy: string;
    }>
  ) => Promise<IIncident | null>;
  get: (teamId: string, incidentId: string) => Promise<IIncident | null>;
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
  export: (teamId: string) => Promise<Array<Record<string, unknown>>>;
  cleanupOrphanedIncidents: () => Promise<boolean>;
}

const SERVICE_NAME = "IncidentService";
const logger = getChildLogger(SERVICE_NAME);
class IncidentService implements IIncidentService {
  public SERVICE_NAME: string;
  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
  }

  private getStartDate(range: string): Date {
    const now = new Date();
    switch (range) {
      case "all":
        return new Date(0);
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

  handleThresholdBreach = async (
    updatedMonitor: IMonitor,
    lastCheck: ICheck,
    evalResult: ThresholdEvaluationResult
  ) => {
    const existing = await Incident.findOne({
      monitorId: updatedMonitor._id,
      teamId: updatedMonitor.teamId,
      resolved: false,
    });

    if (evalResult.hasBreach) {
      if (!existing) {
        const incident = await this.create(
          updatedMonitor.teamId,
          updatedMonitor._id,
          lastCheck._id
        );
        if (evalResult.notes.length) {
          await Incident.updateOne(
            { _id: incident._id },
            {
              $set: {
                resolutionNote: `threshold breach: ${evalResult.notes.join(
                  ", "
                )}`,
              },
            }
          );
        }
        return incident;
      }
      if (evalResult.notes.length) {
        await Incident.updateOne(
          { _id: existing._id },
          {
            $set: {
              resolutionNote: `threshold breach: ${evalResult.notes.join(
                ", "
              )}`,
            },
          }
        );
      }
      return existing;
    } else if (existing) {
      const resolved = await this.resolve(
        updatedMonitor.teamId.toString(),
        existing._id.toString(),
        "auto",
        lastCheck
      );
      return resolved;
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

  createManual = async (data: {
    teamId: string;
    monitorId: string;
    startedAt: Date;
    endedAt?: Date;
    resolved?: boolean;
    resolutionType?: ResolutionType;
    resolutionNote?: string;
    resolvedBy?: string;
  }) => {
    const incidentData: Partial<IIncident> = {
      teamId: new mongoose.Types.ObjectId(data.teamId),
      monitorId: new mongoose.Types.ObjectId(data.monitorId),
      startedAt: data.startedAt,
      resolved: data.resolved ?? false,
    };

    if (data.endedAt) {
      incidentData.endedAt = data.endedAt;
    }

    if (data.resolved) {
      incidentData.resolutionType = data.resolutionType;
      incidentData.resolutionNote = data.resolutionNote;
      if (data.resolvedBy) {
        incidentData.resolvedBy = new mongoose.Types.ObjectId(data.resolvedBy);
      }
    }

    const incident = await Incident.create(incidentData);
    return incident;
  };

  updateManual = async (
    teamId: string,
    incidentId: string,
    data: Partial<{
      monitorId: string;
      startedAt: Date;
      endedAt: Date | undefined;
      resolved: boolean;
      resolutionType: ResolutionType;
      resolutionNote: string;
      resolvedBy: string;
    }>
  ) => {
    const updateData: any = {};

    if (data.monitorId) {
      updateData.monitorId = new mongoose.Types.ObjectId(data.monitorId);
    }
    if (data.startedAt) {
      updateData.startedAt = data.startedAt;
    }
    if (data.endedAt !== undefined) {
      updateData.endedAt = data.endedAt;
    }
    if (data.resolved !== undefined) {
      updateData.resolved = data.resolved;
    }
    if (data.resolutionType !== undefined) {
      updateData.resolutionType = data.resolutionType;
    }
    if (data.resolutionNote !== undefined) {
      updateData.resolutionNote = data.resolutionNote;
    }
    if (data.resolvedBy) {
      updateData.resolvedBy = new mongoose.Types.ObjectId(data.resolvedBy);
    }

    const incident = await Incident.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(incidentId), teamId: new mongoose.Types.ObjectId(teamId) },
      { $set: updateData },
      { new: true }
    );

    return incident;
  };

  get = async (teamId: string, incidentId: string) => {
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

  export = async (teamId: string) => {
    const incidents = await Incident.find({
      teamId,
    })
      .populate("monitorId")
      .populate("resolvedBy")
      .lean<IncidentPopulated[]>();

    return incidents.map((incident) => ({
      monitor: incident.monitorId?.name ?? "",
      monitorId: incident.monitorId?._id?.toString?.() ?? "",
      resolved: incident.resolved,
      resolutionType: incident.resolutionType ?? "Unresolved",
      startedAt: incident.startedAt,
      endedAt: incident.endedAt ?? "Ongoing",
      resolvedBy: incident.resolvedBy ? incident.resolvedBy.email ?? "" : "",
    }));
  };

  async cleanupOrphanedIncidents() {
    try {
      const monitorIds = await Monitor.find().distinct("_id");
      const result = await Incident.deleteMany({
        monitorId: { $nin: monitorIds },
      });
      logger.info(`Deleted ${result.deletedCount} orphaned Incidents.`);
      return true;
    } catch (error) {
      logger.error("Error cleaning up orphaned Incidents:", error);
      return false;
    }
  }
}

export default IncidentService;
