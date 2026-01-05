import type {
  AggregateCheck,
  CheckEntity,
  Monitor,
} from "@/types/domain/index.js";
import type { LatestChecksByMonitor } from "@/repositories/checks/MongoCheckRepository.js";
export interface IChecksRepository {
  // Create
  // Single fetch
  // Collection fetch
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
}

export default IChecksRepository;
