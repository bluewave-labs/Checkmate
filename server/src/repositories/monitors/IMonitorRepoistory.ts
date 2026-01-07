import type {
  Monitor,
  MonitorType,
  MonitorStatus,
} from "@/types/domain/monitor.js";

export type UpdateMonitorPatch = Partial<
  Pick<
    Monitor,
    | "name"
    | "secret"
    | "interval"
    | "rejectUnauthorized"
    | "n"
    | "thresholds"
    | "notificationChannels"
    | "status"
  >
>;

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
  // Create
  create(
    orgId: string,
    userId: string,
    currentTeamId: string,
    monitorData: Monitor
  ): Promise<Monitor>;

  createMany(
    userId: string,
    orgId: string,
    teamId: string,
    monitorData: Monitor[]
  ): Promise<Monitor[]>;

  // Single fetch
  findAll(): Promise<Monitor[]>;
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
  deleteAll(): Promise<boolean>;
  deleteById(monitorId: string, teamId: string): Promise<boolean>;
  deleteByOrgId(orgId: string): Promise<boolean>;

  // Updates
  togglePauseById(
    monitorId: string,
    teamId: string,
    userId: string
  ): Promise<Monitor | null>;

  updateById(
    monitorId: string,
    teamId: string,
    userId: string,
    patch: UpdateMonitorPatch
  ): Promise<Monitor | null>;

  // Counts
  countByOrgId(orgId: string): Promise<number>;
  countByIdAndTeamId(monitorIds: string[], teamId: string): Promise<number>;
}
