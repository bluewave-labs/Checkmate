import type {
	Check,
	ChecksQueryResult,
	CheckDrive,
	ChecksSummary,
	DailyCheckBucket,
	DockerChecksResult,
	DockerContainerStats,
	DriveHistory,
	HardwareChecksResult,
	LatestDrives,
	LatestRaid,
	PageSpeedChecksResult,
	UptimeChecksResult,
} from "@/domain/checks/check.type.js";
import { PendingCheck } from "@/domain/jobs/job.type.js";
import type { MonitorType } from "@/domain/monitors/monitor.type.js";
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
	findByDateRangeAndMonitorId(
		monitorId: string,
		dateRange: DateRange,
		options?: { type?: MonitorType }
	): Promise<UptimeChecksResult | HardwareChecksResult | PageSpeedChecksResult | DockerChecksResult>;
	findDockerContainerChecks(monitorId: string, containerName: string, dateRange: DateRange): Promise<Omit<DockerContainerStats, "restartsInRange">>;
	findSummaryByTeamId(teamId: string, dateRange: DateRange, monitorId?: string): Promise<ChecksSummary>;
	findUnevaluatedByMonitorId(monitorId: string, pending: PendingCheck[]): Promise<Check[]>;
	getDailyStatusBuckets(monitorIds: string[], days: number, timezone: string): Promise<DailyCheckBucket[]>;
	// Storage health (hardware monitors). The latest lookups return null when no check in the lookback carries the data.
	findLatestRaid(monitorId: string): Promise<LatestRaid | null>;
	findLatestDrives(monitorId: string): Promise<LatestDrives | null>; // errors are all of that check's errors
	findLastKnownDrive(monitorId: string, device: string): Promise<{ drive: CheckDrive; checkedAt: string } | null>;
	findDriveHistory(monitorId: string, dateRange: DateRange): Promise<DriveHistory[]>;

	// update
	//delete
	deleteByMonitorId(monitorId: string): Promise<number>;
	deleteByTeamId(teamId: string): Promise<number>;
	deleteByMonitorIdsNotIn(monitorIds: string[]): Promise<number>;
	deleteOlderThan(date: Date): Promise<number>;
}
