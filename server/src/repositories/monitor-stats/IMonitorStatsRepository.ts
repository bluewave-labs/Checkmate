import type { MonitorStats, CheckResultInput } from "@/types/index.js";

export interface IMonitorStatsRepository {
	// create
	create(data: Omit<MonitorStats, "id" | "createdAt" | "updatedAt">): Promise<MonitorStats>;
	// single fetch
	findByMonitorId(monitorId: string): Promise<MonitorStats>;
	// Upsert must be atomic to prevent race conditions
	updateByMonitorId(monitorId: string, result: CheckResultInput): Promise<MonitorStats>;
	// delete
	deleteByMonitorId(monitorId: string): Promise<MonitorStats>;
	deleteByMonitorIds(monitorIds: string[]): Promise<number>;
	deleteByMonitorIdsNotIn(monitorIds: string[]): Promise<number>;
	// other
}
