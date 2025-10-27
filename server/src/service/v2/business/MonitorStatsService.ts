import { MonitorStats } from "../../../db/v2/models/index.js";
import { Monitor } from "../../../db/v2/models/index.js";

const SERVICE_NAME = "MonitorStatsServiceV2";
export interface IMonitorStatsService {
	cleanupOrphanedMonitorStats: () => Promise<boolean>;
}

class MonitorStatsService implements IMonitorStatsService {
	static SERVICE_NAME = SERVICE_NAME;
	constructor() {}

	async cleanupOrphanedMonitorStats() {
		try {
			const monitorIds = await Monitor.find().distinct("_id");
			const result = await MonitorStats.deleteMany({
				monitorId: { $nin: monitorIds },
			});
			console.log(`Deleted ${result.deletedCount} orphaned MonitorStats.`);
			return true;
		} catch (error) {
			console.error("Error cleaning up orphaned MonitorStats:", error);
			return false;
		}
	}
}

export default MonitorStatsService;
