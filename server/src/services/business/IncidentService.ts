import {
  IIncident,
  Incident,
  IMonitor,
  Monitor,
  IUser,
} from "@/db/models/index.js";
import type { ResolutionType } from "@/types/domain/index.js";
import { getChildLogger } from "@/logger/Logger.js";
import { ThresholdEvaluationResult } from "@/services/infrastructure/StatusService.js";
import { getStartDate } from "@/utils/TimeUtils.js";
import type {
  Monitor as MonitorEntity,
  CheckEntity,
  Incident as IncidentEntity,
  IncidentWithDetails,
} from "@/types/domain/index.js";
import type { IIncidentsRepository } from "@/repositories/index.js";

export interface IIncidentService {
  handleStatusChange: (
    updatedMonitor: MonitorEntity,
    lastCheck: CheckEntity
  ) => Promise<IncidentEntity | null>;
  handleThresholdBreach: (
    updatedMonitor: MonitorEntity,
    lastCheck: CheckEntity,
    evalResult: ThresholdEvaluationResult
  ) => Promise<IncidentEntity | null>;
  create: (
    teamId: string,
    monitorId: string,
    startCheckId: string
  ) => Promise<IncidentEntity>;
  get: (
    teamId: string,
    incidentId: string
  ) => Promise<IncidentWithDetails | null>;
  getAll: (
    teamId: string,
    monitorId: string,
    page: number,
    rowsPerPage: number,
    range: string,
    resolved?: boolean,
    resolutionType?: ResolutionType
  ) => Promise<{ incidents: IncidentEntity[]; count: number }>;
  resolve: (
    teamId: string,
    incidentId: string,
    resolutionType: ResolutionType,
    lastCheck?: CheckEntity,
    resolvedBy?: string,
    resolutionNote?: string
  ) => Promise<IncidentEntity | null>;
  delete: (teamId: string, incidentId: string) => Promise<boolean>;
  export: (teamId: string) => Promise<Array<Record<string, unknown>>>;
  cleanupOrphanedIncidents: () => Promise<boolean>;
}

const SERVICE_NAME = "IncidentService";
const logger = getChildLogger(SERVICE_NAME);
class IncidentService implements IIncidentService {
  public SERVICE_NAME: string;
  private incidentsRepository: IIncidentsRepository;
  constructor(incidentsRepository: IIncidentsRepository) {
    this.SERVICE_NAME = SERVICE_NAME;
    this.incidentsRepository = incidentsRepository;
  }

  handleStatusChange = async (
    updatedMonitor: MonitorEntity,
    lastCheck: CheckEntity
  ) => {
    if (updatedMonitor.status === "down") {
      const incident = await this.create(
        updatedMonitor.teamId,
        updatedMonitor.id,
        lastCheck.id
      );

      return incident;
    } else if (updatedMonitor.status === "up") {
      const incident =
        await this.incidentsRepository.findByMonitorIdAndResolved(
          updatedMonitor.id,
          updatedMonitor.teamId,
          false
        );

      if (!incident) {
        return null;
      }

      const resolvedIncident = await this.resolve(
        updatedMonitor.teamId,
        incident.id,
        "auto",
        lastCheck
      );
      return resolvedIncident;
    }
    return null;
  };

  handleThresholdBreach = async (
    updatedMonitor: MonitorEntity,
    lastCheck: CheckEntity,
    evalResult: ThresholdEvaluationResult
  ) => {
    const existing = await this.incidentsRepository.findByMonitorIdAndResolved(
      updatedMonitor.id,
      updatedMonitor.teamId,
      false
    );

    if (evalResult.hasBreach) {
      if (!existing) {
        const incident = await this.incidentsRepository.create({
          teamId: updatedMonitor.teamId,
          monitorId: updatedMonitor.id,
          startCheck: lastCheck.id,
        });
        if (evalResult.notes.length) {
          await this.incidentsRepository.updateById(
            incident.id,
            updatedMonitor.teamId,
            {
              resolutionNote: `threshold breach: ${evalResult.notes.join(
                ", "
              )}`,
            }
          );
        }
        return incident;
      }
      if (evalResult.notes.length) {
        await this.incidentsRepository.updateById(
          existing.id,
          updatedMonitor.teamId,
          {
            resolutionNote: `threshold breach: ${evalResult.notes.join(", ")}`,
          }
        );
      }
      return existing;
    } else if (existing) {
      const resolved = await this.resolve(
        updatedMonitor.teamId,
        existing.id,
        "auto",
        lastCheck
      );
      return resolved;
    }

    return null;
  };

  create = async (teamId: string, monitorId: string, startCheckId: string) => {
    const existing = await this.incidentsRepository.findByMonitorIdAndResolved(
      monitorId,
      teamId,
      false
    );

    if (existing) {
      return existing;
    }

    let data: Partial<IncidentEntity> = {
      teamId,
      monitorId,
      startCheck: startCheckId,
    };
    const incident = await this.incidentsRepository.create(data);
    return incident;
  };

  get = async (teamId: string, incidentId: string) => {
    const incident =
      await this.incidentsRepository.findByIdWithMonitorAndResolvedBy(
        incidentId,
        teamId
      );
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
    const startDate = getStartDate(range);

    const [count, incidents] = await Promise.all([
      this.incidentsRepository.count(
        teamId,
        startDate,
        monitorId,
        resolved,
        resolutionType
      ),
      this.incidentsRepository.findAllWithMonitorAndResolvedBy(
        teamId,
        page,
        rowsPerPage,
        startDate,
        monitorId,
        resolved,
        resolutionType
      ),
    ]);
    return { count, incidents };
  };

  resolve = async (
    teamId: string,
    incidentId: string,
    resolutionType: ResolutionType,
    lastCheck?: CheckEntity,
    resolvedBy?: string,
    resolutionNote?: string
  ) => {
    const resolvedIncident = await this.incidentsRepository.updateById(
      incidentId,
      teamId,
      {
        resolved: true,
        endedAt: new Date(),
        endCheck: lastCheck ? lastCheck.id : undefined,
        resolvedBy: resolvedBy ? resolvedBy : undefined,
        resolutionType,
        resolutionNote: resolutionNote ? resolutionNote : undefined,
      }
    );

    return resolvedIncident;
  };

  delete = async (teamId: string, incidentId: string) => {
    return await this.incidentsRepository.deleteById(incidentId, teamId);
  };

  export = async (teamId: string) => {
    const incidents = await this.incidentsRepository.findAllByTeamId(teamId);
    return incidents.map((incident) => ({
      monitor: incident.monitor.name ?? "",
      monitorId: incident.monitor.id ?? "",
      resolved: incident.resolved,
      resolutionType: incident.resolutionType ?? "Unresolved",
      startedAt: incident.startedAt,
      endedAt: incident.endedAt ?? "Ongoing",
      resolvedBy: incident.resolvedByUser
        ? incident.resolvedByUser.email ?? ""
        : "",
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
