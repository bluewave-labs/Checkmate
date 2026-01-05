import type {
  AggregateCheck,
  CheckEntity,
  Monitor,
  MonitorStatus,
} from "@/types/domain/index.js";
import type { LatestChecksByMonitor } from "@/repositories/checks/MongoCheckRepository.js";
export interface IChecksRepository {
  // Create
  create(checkData: Partial<CheckEntity>): Promise<CheckEntity>;
  // Single fetch
  findById(checkId: string, teamId: string): Promise<CheckEntity | null>;
  // Collection fetch
  findByTeamIdAndStatus(
    status: MonitorStatus,
    teamId: string,
    startDate: Date,
    page: number,
    rowsPerPage: number
  ): Promise<CheckEntity[]>;
  findByMonitorIdAndStatus(
    status: MonitorStatus,
    teamId: string,
    monitorId: string,
    startDate: Date,
    page: number,
    rowsPerPage: number
  ): Promise<CheckEntity[]>;
  findCountByMonitorId(monitorId: string): Promise<number>;
  findPageByMonitorId(
    monitorId: string,
    page: number,
    rowsPerPage: number
  ): Promise<CheckEntity[]>;

  findLatestChecksByMonitorIds(
    monitorIds: string[]
  ): Promise<LatestChecksByMonitor>;
  findRecentChecksByMonitor(
    monitor: Monitor,
    startDate: Date
  ): Promise<AggregateCheck[]>;
  findDateRangeChecksByMonitor(
    monitor: Monitor,
    startDate: Date,
    range: string
  ): Promise<AggregateCheck[]>;
  // Update
  // Delete
  deleteManyExcludedByMonitorIds(monitorIds: string[]): Promise<number>;
}

export default IChecksRepository;
