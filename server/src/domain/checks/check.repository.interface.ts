import type {
	Check,
	ChecksQueryResult,
	ChecksSummary,
	HardwareChecksResult,
	PageSpeedChecksResult,
	UptimeChecksResult,
} from "@/domain/checks/check.type.js";
import type { MonitorType } from "@/domain/monitors/monitor.type.js";
import type { LatestChecksMap } from "@/domain/checks/check.repository.mongo.js";
import { CheckFilter, DateRange } from "@/types/query.js";

export interface IChecksRepository {
	// create
	create(check: Check): Promise<Check>;
	createChecks(checks: Check[]): Promise<Check[]>;

	// single fetch
	// collection fetch
	findByMonitorId(
		monitorId: string,
		sortOrder: string,
		dateRange: DateRange,
		page: number,
		rowsPerPage: number,
		status: boolean | undefined,
		filter?: CheckFilter
	): Promise<ChecksQueryResult>;
	findByTeamId(
		sortOrder: string,
		dateRange: DateRange,
		page: number,
		rowsPerPage: number,
		teamId: string,
		filter?: CheckFilter
	): Promise<ChecksQueryResult>;
	findLatestByMonitorIds(monitorIds: string[], options?: { limitPerMonitor?: number }): Promise<LatestChecksMap>;
	findByDateRangeAndMonitorId(
		monitorId: string,
		dateRange: DateRange,
		options?: { type?: MonitorType }
	): Promise<UptimeChecksResult | HardwareChecksResult | PageSpeedChecksResult>;
	findSummaryByTeamId(teamId: string, dateRange: DateRange): Promise<ChecksSummary>;
	findUnevaluatedByMonitorId(monitorId: string, since: number): Promise<Check[]>;
	// update
	//delete
	deleteByMonitorId(monitorId: string): Promise<number>;
	deleteByTeamId(teamId: string): Promise<number>;
	deleteByMonitorIdsNotIn(monitorIds: string[]): Promise<number>;
	deleteOlderThan(date: Date): Promise<number>;
}
