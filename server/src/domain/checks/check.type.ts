import type { z } from "zod";
import type { MonitorType } from "@/domain/monitors/monitor.type.js";
import type { DockerContainerInfo, DockerContainerSummary } from "@/domain/docker/docker.type.js";
import type { Response } from "got";
import {
	checkAuditsSchema,
	checkCaptureInfoSchema,
	checkCpuInfoSchema,
	checkDiskInfoSchema,
	checkErrorInfoSchema,
	checkHostInfoSchema,
	checkMemoryInfoSchema,
	checkMetadataSchema,
	checkNetworkInterfaceInfoSchema,
	checkSchema,
	checkSnapshotSchema,
	checksPageSchema,
	checksSummarySchema,
	lighthouseAuditSchema,
} from "@/domain/checks/check.schema.js";

export const CHECK_TTL_SENTINEL = 366;

export type GotTimings = Response["timings"];

export type CheckMetadata = z.infer<typeof checkMetadataSchema>;
export type CheckCpuInfo = z.infer<typeof checkCpuInfoSchema>;
export type CheckMemoryInfo = z.infer<typeof checkMemoryInfoSchema>;
export type CheckHostInfo = z.infer<typeof checkHostInfoSchema>;
export type CheckCaptureInfo = z.infer<typeof checkCaptureInfoSchema>;
export type CheckDiskInfo = z.infer<typeof checkDiskInfoSchema>;
export type CheckErrorInfo = z.infer<typeof checkErrorInfoSchema>;
export type CheckNetworkInterfaceInfo = z.infer<typeof checkNetworkInterfaceInfoSchema>;
export type CheckAudits = z.infer<typeof checkAuditsSchema>;
export type ILighthouseAudit = z.infer<typeof lighthouseAuditSchema>;
export type Check = z.infer<typeof checkSchema>;
export type ChecksQueryResult = z.infer<typeof checksPageSchema>;

export interface PageSpeedChecksResult {
	monitorType: "pagespeed";
	groupedChecks: PageSpeedGroupedCheck[];
}

export interface GroupedCheck {
	bucketDate: string;
	avgResponseTime: number;
	totalChecks: number;
}

export interface GroupedUptimeCheck extends GroupedCheck {
	avgDns: number;
	avgTcp: number;
	avgTls: number;
	avgRequest: number;
	avgFirstByte: number;
	avgDownload: number;
}

export interface PageSpeedGroupedCheck {
	bucketDate: string;
	performance: number;
	accessibility: number;
	bestPractices: number;
	seo: number;
}

export interface UptimeChecksResult {
	monitorType: Exclude<MonitorType, "hardware" | "pagespeed" | "docker">;
	groupedChecks: GroupedUptimeCheck[];
	groupedUpChecks: GroupedCheck[];
	groupedDownChecks: GroupedCheck[];
	uptimePercentage: number;
	avgResponseTime: number;
}

export type ChecksSummary = z.infer<typeof checksSummarySchema>;

export type CheckSnapshot = z.infer<typeof checkSnapshotSchema>;
export type SnapshotCpuInfo = NonNullable<CheckSnapshot["cpu"]>;
export type SnapshotMemoryInfo = NonNullable<CheckSnapshot["memory"]>;
export type SnapshotDiskInfo = NonNullable<CheckSnapshot["disk"]>[number];
export type SnapshotHostInfo = NonNullable<CheckSnapshot["host"]>;

export interface HardwareDiskStats {
	name: string;
	readSpeed: number;
	writeSpeed: number;
	totalBytes: number;
	freeBytes: number;
	usagePercent: number;
}

export interface HardwareNetStats {
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
}

export interface HardwareCheckStats {
	bucketDate: string;
	avgCpuUsage: number;
	avgMemoryUsage: number;
	avgTemperature: number[];
	disks: HardwareDiskStats[];
	net: HardwareNetStats[];
}

export interface HardwareStats {
	aggregateData: {
		totalChecks: number;
	};
	upChecks: {
		totalChecks: number;
	};
	checks: HardwareCheckStats[];
}

export interface HardwareChecksResult extends HardwareStats {
	monitorType: "hardware";
}

export type DailyCheckBucket = {
	monitorId: string;
	date: string;
	totalChecks: number;
	upChecks: number;
	downChecks: number;
	avgResponseTime: number | null;
};

export type DockerStatsBucket = {
	_id: string;
	avgResponseTime: number | null;
	upCount: number;
	totalCount: number;
	avgRunning: number | null;
	avgTotal: number | null;
	avgUnhealthy: number | null;
};

export interface DockerStats {
	aggregateData: { totalChecks: number };
	upChecks: { totalChecks: number };
	aggregate: DockerStatsBucket[];
	latest: {
		containers: DockerContainerInfo[];
		summary?: DockerContainerSummary;
		checkedAt: string;
	} | null;
}

export interface DockerChecksResult extends DockerStats {
	monitorType: "docker";
}

export type DockerContainerStatsBucket = {
	_id: string;
	avgCpuPct: number | null;
	avgMemoryUsedBytes: number | null;
	avgMemoryPct: number | null;
	minRestartCount: number | null;
	maxRestartCount: number | null;
};

export interface DockerContainerStats {
	aggregate: DockerContainerStatsBucket[];
	restartsInRange: number;
	latest: {
		container: DockerContainerInfo;
		checkedAt: string;
	} | null;
}
