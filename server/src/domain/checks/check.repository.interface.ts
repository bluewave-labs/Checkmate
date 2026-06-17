import type {
	Check,
	ChecksQueryResult,
	ChecksSummary,
	HardwareChecksResult,
	PageSpeedChecksResult,
	UptimeChecksResult,
} from "@/domain/checks/check.type.js";
import type { MonitorType } from "@/domain/monitors/monitor.types.js";
import type { LatestChecksMap } from "@/domain/checks/check.repository.mongo.js";

export interface IChecksRepository {
	// create
	create(check: Check): Promise<Check>;
	createChecks(checks: Check[]): Promise<Check[]>;

	// single fetch
	// collection fetch
	findByMonitorId(
		monitorId: string,
		sortOrder: string,
		dateRange: string,
		filter: string | undefined,
		page: number,
		rowsPerPage: number,
		status: boolean | undefined
	): Promise<ChecksQueryResult>;
	findByTeamId(
		sortOrder: string,
		dateRange: string,
		filter: string | undefined,
		page: number,
		rowsPerPage: number,
		teamId: string
	): Promise<ChecksQueryResult>;
	findLatestByMonitorIds(monitorIds: string[], options?: { limitPerMonitor?: number }): Promise<LatestChecksMap>;
	findByDateRangeAndMonitorId(
		monitorId: string,
		startDate: Date,
		endDate: Date,
		dateString: string,
		options?: { type?: MonitorType }
	): Promise<UptimeChecksResult | HardwareChecksResult | PageSpeedChecksResult>;
	findSummaryByTeamId(teamId: string, dateRange: string): Promise<ChecksSummary>;
	findUnevaluatedByMonitorId(monitorId: string, since: number): Promise<Check[]>;
	// update
	//delete
	deleteByMonitorId(monitorId: string): Promise<number>;
	deleteByTeamId(teamId: string): Promise<number>;
	deleteByMonitorIdsNotIn(monitorIds: string[]): Promise<number>;
	deleteOlderThan(date: Date): Promise<number>;
}
