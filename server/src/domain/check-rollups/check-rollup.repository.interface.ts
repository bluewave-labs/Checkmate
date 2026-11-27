import type { DailyCheckBucket, UptimeChecksResult } from "@/domain/checks/check.type.js";
import type { UptimeDetailsSupportedType } from "@/domain/monitors/monitor.type.js";
import type { DateRange } from "@/types/query.js";
import type { HardwareMonitorInterval } from "@/domain/check-rollups/check-rollup.type.js";

export interface ICheckRollupsRepository {
	// write
	rollUp(from: Date, to: Date, hardwareIntervals?: HardwareMonitorInterval[]): Promise<void>;
	// single fetch
	findLatestBucketStart(): Promise<Date | null>;
	// collection fetch
	findUptimeDateRange(monitorId: string, monitorType: UptimeDetailsSupportedType, dateRange: DateRange): Promise<UptimeChecksResult>;
	getDailyStatusBuckets(monitorIds: string[], days: number, timezone: string): Promise<DailyCheckBucket[]>;
	// delete
	deleteByMonitorId(monitorId: string): Promise<number>;
	deleteByTeamId(teamId: string): Promise<number>;
	deleteByMonitorIdsNotIn(monitorIds: string[]): Promise<number>;
}
