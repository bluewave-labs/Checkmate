import mongoose from "mongoose";
import type { IIncidentsRepository } from "./IIncidentsRepository.js";
import type {
  Incident as IncidentEntity,
  IncidentWithDetails,
  ResolutionType,
} from "@/types/domain/index.js";
import type { IIncident, IMonitor, IUser } from "@/db/models/index.js";
import { Incident } from "@/db/models/index.js";

type IncidentPopulated = Omit<IIncident, "monitorId" | "resolvedBy"> & {
  monitorId: IMonitor;
  resolvedBy?: IUser | null;
};

class MongoIncidentsRepository implements IIncidentsRepository {
  private toEntity = (doc: IIncident): IncidentEntity => {
    return {
      id: doc._id.toString(),
      monitorId: doc.monitorId.toString(),
      teamId: doc.teamId.toString(),
      startedAt: doc.startedAt,
      startCheck: doc.startCheck.toString(),
      endedAt: doc.endedAt,
      endCheck: doc.endCheck?.toString(),
      resolved: doc.resolved,
      resolvedBy: doc.resolvedBy?.toString(),
      resolutionType: doc.resolutionType,
      resolutionNote: doc.resolutionNote,
    };
  };

  private toEntityWithDetails = (
    doc: IncidentPopulated
  ): IncidentWithDetails => {
    return {
      id: doc._id.toString(),
      monitorId: "",
      teamId: doc.teamId.toString(),
      startedAt: doc.startedAt,
      startCheck: doc.startCheck.toString(),
      endedAt: doc.endedAt,
      endCheck: doc.endCheck?.toString(),
      resolved: doc.resolved,
      resolutionType: doc.resolutionType,
      resolutionNote: doc.resolutionNote,
      monitor: {
        id: doc.monitorId._id.toString(),
        name: doc.monitorId.name,
        type: doc.monitorId.type,
        status: doc.monitorId.status,
      },
      resolvedByUser: doc.resolvedBy
        ? {
            email: doc.resolvedBy.email,
          }
        : undefined,
    };
  };

  create = async (incidentData: Partial<IncidentEntity>) => {
    const existing = await Incident.findOne({
      monitorId: incidentData.monitorId,
      teamId: incidentData.teamId,
      resolved: false,
    });

    if (existing) {
      return this.toEntity(existing);
    }

    const { teamId, monitorId, startCheck } = incidentData;

    const incident = await Incident.create({
      monitorId: new mongoose.Types.ObjectId(monitorId),
      teamId: new mongoose.Types.ObjectId(teamId),
      startedAt: new Date(),
      startCheck: new mongoose.Types.ObjectId(startCheck),
    });

    return this.toEntity(incident);
  };

  findByMonitorIdAndResolved = async (
    monitorId: string,
    teamId: string,
    resolved: boolean
  ) => {
    const incident = await Incident.findOne({
      monitorId: monitorId,
      teamId: teamId,
      resolved: resolved,
    });

    if (!incident) return null;

    return this.toEntity(incident);
  };

  findByIdWithMonitorAndResolvedBy = async (
    incidentId: string,
    teamId: string
  ) => {
    const incident = await Incident.findOne({
      _id: new mongoose.Types.ObjectId(incidentId),
      teamId: new mongoose.Types.ObjectId(teamId),
    })
      .populate("monitorId")
      .populate("resolvedBy")
      .lean<IncidentPopulated>();
    if (!incident) return null;
    return this.toEntityWithDetails(incident);
  };

  count = async (
    teamId: string,
    startDate: Date,
    monitorId?: string,
    resolved?: boolean,
    resolutionType?: ResolutionType
  ) => {
    const count = await Incident.countDocuments({
      teamId: teamId,
      ...(monitorId && { monitorId }),
      createdAt: { $gte: startDate },
      ...(resolved !== undefined && { resolved }),
      ...(resolutionType !== undefined && { resolutionType }),
    });
    return count;
  };

  findAllWithMonitorAndResolvedBy = async (
    teamId: string,
    page: number,
    rowsPerPage: number,
    startDate: Date,
    monitorId?: string,
    resolved?: boolean,
    resolutionType?: ResolutionType
  ) => {
    const match = {
      teamId: teamId,
      ...(monitorId && { monitorId }),
      createdAt: { $gte: startDate },
      ...(resolved !== undefined && { resolved }),
      ...(resolutionType !== undefined && { resolutionType }),
    };
    const incidents = await Incident.find(match)
      .populate("monitorId")
      .populate("resolvedBy")
      .sort({ createdAt: -1 })
      .skip(page * rowsPerPage)
      .limit(rowsPerPage)
      .lean<IncidentPopulated[]>();
    return incidents.map((incident) => this.toEntityWithDetails(incident));
  };

  findAllByTeamId = async (teamId: string) => {
    const incidents = await Incident.find({
      teamId,
    })
      .populate("monitorId")
      .populate("resolvedBy")
      .lean<IncidentPopulated[]>();
    return incidents.map((incident) => this.toEntityWithDetails(incident));
  };

  updateById = async (
    incidentId: string,
    teamId: string,
    updates: Partial<IncidentEntity>
  ) => {
    const updatedIncident = await Incident.findOneAndUpdate(
      { _id: incidentId, teamId, resolved: false },
      {
        $set: updates,
      },
      { new: true }
    );
    return this.toEntity(updatedIncident!);
  };

  deleteById = async (incidentId: string, teamId: string) => {
    const result = await Incident.deleteOne({
      _id: new mongoose.Types.ObjectId(incidentId),
      teamId: new mongoose.Types.ObjectId(teamId),
    });
    return result.deletedCount === 1;
  };

  deleteManyExcludedByMonitorIds = async (monitorIds: string[]) => {
    const result = await Incident.deleteMany({
      monitorId: {
        $nin: monitorIds.map((id) => new mongoose.Types.ObjectId(id)),
      },
    });
    return result.deletedCount || 0;
  };
}

export default MongoIncidentsRepository;
