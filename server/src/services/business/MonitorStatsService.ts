import { Monitor, MonitorStats } from "@/db/models/index.js";
import { getChildLogger } from "@/logger/Logger.js";

const SERVICE_NAME = "MonitorStatsService";
const logger = getChildLogger(SERVICE_NAME);
export interface IMonitorStatsService {
  cleanupOrphanedMonitorStats: () => Promise<boolean>;
}

class MonitorStatsService implements IMonitorStatsService {
  public SERVICE_NAME: string;
  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
  }

  async cleanupOrphanedMonitorStats() {
    try {
      const monitorIds = await Monitor.find().distinct("_id");
      const result = await MonitorStats.deleteMany({
        monitorId: { $nin: monitorIds },
      });
      logger.info(`Deleted ${result.deletedCount} orphaned MonitorStats.`);
      return true;
    } catch (error) {
      logger.error("Error cleaning up orphaned MonitorStats:", error);
      return false;
    }
  }
}

export default MonitorStatsService;
