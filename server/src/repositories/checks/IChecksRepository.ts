import type { CheckEntity } from "@/types/domain/index.js";
import type { LatestChecksByMonitor } from "@/repositories/checks/MongoCheckRepository.js";
export interface IChecksRepository {
  // Create
  // Single fetch
  // Collection fetch
  findLatestChecksByMonitorIds(
    monitorIds: string[]
  ): Promise<LatestChecksByMonitor>;
  // Update
  // Delete
}

export default IChecksRepository;
