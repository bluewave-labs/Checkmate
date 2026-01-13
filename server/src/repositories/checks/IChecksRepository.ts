import type { LatestChecksMap } from "@/repositories/checks/MongoChecksRepistory.js";

export interface IChecksRepository {
	findLatestChecksByMonitorIds(monitorIds: string[]): Promise<LatestChecksMap>;
	findDateRangeChecksByMonitor(
		monitorId: string,
		startDate: Date,
		endDate: Date,
		dateString: string
	): Promise<{
		groupedChecks: Array<{ _id: string; avgResponseTime: number; totalChecks: number }>;
		groupedUpChecks: Array<{ _id: string; totalChecks: number; avgResponseTime: number }>;
		groupedDownChecks: Array<{ _id: string; totalChecks: number; avgResponseTime: number }>;
		uptimePercentage: number;
		avgResponseTime: number;
	}>;
}
