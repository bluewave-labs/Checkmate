import type { MonitorStats } from "@/types/index.js";
export interface IMonitorStatsRepository {
	// create
	// single fetch
	findByMonitorId(monitorId: string): Promise<MonitorStats>;
	// update
	// delete
	deleteByMonitorId(monitorId: string): Promise<MonitorStats>;
	// other
}
