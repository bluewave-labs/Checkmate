import type {
  Incident as IncidentEntity,
  IncidentWithDetails,
  ResolutionType,
} from "@/types/domain/index.js";

export interface IIncidentsRepository {
  // create
  create(incident: Partial<IncidentEntity>): Promise<IncidentEntity>;
  // single fetch
  findByMonitorIdAndResolved(
    monitorId: string,
    teamId: string,
    resolved: boolean
  ): Promise<IncidentEntity | null>;
  findByIdWithMonitorAndResolvedBy(
    incidentId: string,
    teamId: string
  ): Promise<IncidentWithDetails | null>;
  // collection fetch
  count(
    teamId: string,
    startDate: Date,
    monitorId?: string,
    resolved?: boolean,
    resolutionType?: ResolutionType
  ): Promise<number>;
  findAllWithMonitorAndResolvedBy(
    teamId: string,
    page: number,
    rowsPerPage: number,
    startDate: Date,
    monitorId?: string,
    resolved?: boolean,
    resolutionType?: ResolutionType
  ): Promise<IncidentWithDetails[]>;

  findAllByTeamId(teamId: string): Promise<IncidentWithDetails[]>;
  // update
  updateById(
    incidentId: string,
    teamId: string,
    updates: Partial<IncidentEntity>
  ): Promise<IncidentEntity | null>;
  // delete
  deleteById(incidentId: string, teamId: string): Promise<boolean>;
}

export default IIncidentsRepository;
