import type {
  Monitor,
  MonitorType,
  MonitorStatus,
} from "@/types/domain/monitor.js";

export interface TeamQueryConfig {
  search: string;
  sortField: string;
  sortOrder: string;
  page: number;
  rowsPerPage: number;
  type: MonitorType[];
  status: MonitorStatus[];
}

export interface IMonitorRepository {
  // Single fetch
  findById(monitorId: string, teamId: string): Promise<Monitor | null>;

  // Collection fetches
  findByTeamId(teamId: string): Promise<Monitor[]>;
  findByTeamIdWithConfig(
    teamId: string,
    config: TeamQueryConfig
  ): Promise<Monitor[]>;

  findMonitorCountsByTeamId(teamId: string): Promise<{
    total: number;
    upCount: number;
    downCount: number;
    pausedCount: number;
  }>;
  findByOrgId(orgId: string): Promise<Monitor[]>;

  // Deletions
  deleteById(id: string): Promise<boolean>;
  deleteByOrgId(orgId: string): Promise<number>;
}

export default IMonitorRepository;
