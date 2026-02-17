import type { MonitorStats } from "@/types/index.js";
export interface IMonitorStatsRepository {
	// create
	create(data: Omit<MonitorStats, "id" | "createdAt" | "updatedAt">): Promise<MonitorStats>;
	// single fetch
	findByMonitorId(monitorId: string): Promise<MonitorStats>;
	// update
	// delete
	deleteByMonitorId(monitorId: string): Promise<MonitorStats>;
	deleteByMonitorIds(monitorIds: string[]): Promise<number>;
	deleteByMonitorIdsNotIn(monitorIds: string[]): Promise<number>;
	// other
}
