import type { Check, MonitorType } from "@/types/index.js";
import type { LatestChecksMap } from "@/repositories/checks/MongoChecksRepistory.js";

export interface PageSpeedChecksResult {
	monitorType: "pagespeed";
	checks: Check[];
}

export interface HardwareChecksResult {
	monitorType: "hardware";
	aggregateData: {
		latestCheck: Check | null;
		totalChecks: number;
	};
	upChecks: {
		totalChecks: number;
	};
	checks: Array<{
		_id: string;
		avgCpuUsage: number;
		avgMemoryUsage: number;
		avgTemperature: number[];
		disks: Array<{
			name: string;
			readSpeed: number;
			writeSpeed: number;
			totalBytes: number;
			freeBytes: number;
			usagePercent: number;
		}>;
		net: Array<{
			name: string;
			bytesSentPerSecond: number;
			deltaBytesRecv: number;
			deltaPacketsSent: number;
			deltaPacketsRecv: number;
			deltaErrIn: number;
			deltaErrOut: number;
			deltaDropIn: number;
			deltaDropOut: number;
			deltaFifoIn: number;
			deltaFifoOut: number;
		}>;
	}>;
}

export interface UptimeChecksResult {
	monitorType: Exclude<MonitorType, "hardware" | "pagespeed">;
	groupedChecks: Array<{ _id: string; avgResponseTime: number; totalChecks: number }>;
	groupedUpChecks: Array<{ _id: string; totalChecks: number; avgResponseTime: number }>;
	groupedDownChecks: Array<{ _id: string; totalChecks: number; avgResponseTime: number }>;
	uptimePercentage: number;
	avgResponseTime: number;
}

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
	): Promise<any>;
	findByTeamId(sortOrder: string, dateRange: string, filter: string, page: number, rowsPerPage: number, teamId: string): Promise<any>;
	findLatestByMonitorIds(monitorIds: string[], options?: { limitPerMonitor?: number }): Promise<LatestChecksMap>;
	findByDateRangeAndMonitorId(
		monitorId: string,
		startDate: Date,
		endDate: Date,
		dateString: string,
		options?: { type?: MonitorType }
	): Promise<UptimeChecksResult | HardwareChecksResult | PageSpeedChecksResult>;
	findSummaryByTeamId(teamId: string): Promise<any>;
	// update
	//delete
	deleteByMonitorId(monitorId: string): Promise<number>;
	deleteByTeamId(teamId: string): Promise<number>;
}
