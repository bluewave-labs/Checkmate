import type {
  IMonitorRepository,
  IMonitorStatsRepository,
} from "@/repositories/index.js";
import { getChildLogger } from "@/logger/Logger.js";

const SERVICE_NAME = "MonitorStatsService";
const logger = getChildLogger(SERVICE_NAME);
export interface IMonitorStatsService {
  cleanupOrphanedMonitorStats: () => Promise<boolean>;
}

class MonitorStatsService implements IMonitorStatsService {
  public SERVICE_NAME: string;
  private monitorRepository: IMonitorRepository;
  private monitorStatsRepository: IMonitorStatsRepository;

  constructor(
    monitorRepository: IMonitorRepository,
    monitorStatsRepository: IMonitorStatsRepository
  ) {
    this.SERVICE_NAME = SERVICE_NAME;
    this.monitorRepository = monitorRepository;
    this.monitorStatsRepository = monitorStatsRepository;
  }

  async cleanupOrphanedMonitorStats() {
    try {
      const monitorIds = (await this.monitorRepository.findAll()).map(
        (m) => m.id
      );
      const deletedCount =
        await this.monitorStatsRepository.deleteManyExcludedByMonitorIds(
          monitorIds
        );
      logger.info(`Deleted ${deletedCount} orphaned MonitorStats.`);
      return true;
    } catch (error) {
      logger.error("Error cleaning up orphaned MonitorStats:", error);
      return false;
    }
  }
}

export default MonitorStatsService;
