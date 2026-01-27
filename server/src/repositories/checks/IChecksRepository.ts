import type {
	Check,
	ChecksQueryResult,
	ChecksSummary,
	MonitorType,
	PageSpeedChecksResult,
	HardwareChecksResult,
	UptimeChecksResult,
} from "@/types/index.js";
import type { LatestChecksMap } from "@/repositories/checks/MongoChecksRepistory.js";

export interface IChecksRepository {
	// create
	createChecks(checks: Check[]): Promise<Check[]>;

	// single fetch
	// collection fetch
	findByMonitorId(
		monitorId: string,
		sortOrder: string,
		dateRange: string,
		filter: string,
		page: number,
		rowsPerPage: number,
		status: boolean | undefined
	): Promise<ChecksQueryResult>;
	findByTeamId(sortOrder: string, dateRange: string, filter: string, page: number, rowsPerPage: number, teamId: string): Promise<ChecksQueryResult>;
	findLatestByMonitorIds(monitorIds: string[], options?: { limitPerMonitor?: number }): Promise<LatestChecksMap>;
	findByDateRangeAndMonitorId(
		monitorId: string,
		startDate: Date,
		endDate: Date,
		dateString: string,
		options?: { type?: MonitorType }
	): Promise<UptimeChecksResult | HardwareChecksResult | PageSpeedChecksResult>;
	findSummaryByTeamId(teamId: string, dateRange: string): Promise<ChecksSummary>;
	// update
	//delete
	deleteByMonitorId(monitorId: string): Promise<number>;
	deleteByTeamId(teamId: string): Promise<number>;
}
