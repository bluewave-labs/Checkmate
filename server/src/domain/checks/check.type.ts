import type { z } from "zod";
import type { MonitorType } from "@/domain/monitors/monitor.type.js";
import type { Response } from "got";
import type {
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
	dailyCheckBucketSchema,
	dockerContainerStatsBucketSchema,
	dockerContainerStatsSchema,
	dockerStatsBucketSchema,
	dockerStatsSchema,
	groupedCheckSchema,
	groupedUptimeCheckSchema,
	hardwareCheckStatsSchema,
	hardwareDiskStatsSchema,
	hardwareNetStatsSchema,
	hardwareStatsSchema,
	lighthouseAuditSchema,
	pageSpeedGroupedCheckSchema,
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
export type ChecksSummary = z.infer<typeof checksSummarySchema>;

export type CheckSnapshot = z.infer<typeof checkSnapshotSchema>;
export type SnapshotCpuInfo = NonNullable<CheckSnapshot["cpu"]>;
export type SnapshotMemoryInfo = NonNullable<CheckSnapshot["memory"]>;
export type SnapshotDiskInfo = NonNullable<CheckSnapshot["disk"]>[number];
export type SnapshotHostInfo = NonNullable<CheckSnapshot["host"]>;

export type GroupedCheck = z.infer<typeof groupedCheckSchema>;
export type GroupedUptimeCheck = z.infer<typeof groupedUptimeCheckSchema>;
export type PageSpeedGroupedCheck = z.infer<typeof pageSpeedGroupedCheckSchema>;
export type HardwareDiskStats = z.infer<typeof hardwareDiskStatsSchema>;
export type HardwareNetStats = z.infer<typeof hardwareNetStatsSchema>;
export type HardwareCheckStats = z.infer<typeof hardwareCheckStatsSchema>;
export type HardwareStats = z.infer<typeof hardwareStatsSchema>;
export type DailyCheckBucket = z.infer<typeof dailyCheckBucketSchema>;
export type DockerStatsBucket = z.infer<typeof dockerStatsBucketSchema>;
export type DockerStats = z.infer<typeof dockerStatsSchema>;
export type DockerContainerStatsBucket = z.infer<typeof dockerContainerStatsBucketSchema>;
export type DockerContainerStats = z.infer<typeof dockerContainerStatsSchema>;

// Repository results for the monitor details queries. The service unpacks these into the
// *DetailsResult shapes in monitor.schema.ts; the discriminator never leaves the server.
export interface UptimeChecksResult {
	monitorType: Exclude<MonitorType, "hardware" | "pagespeed" | "docker">;
	groupedChecks: GroupedUptimeCheck[];
	groupedUpChecks: GroupedCheck[];
	groupedDownChecks: GroupedCheck[];
	uptimePercentage: number;
	avgResponseTime: number;
}

export interface PageSpeedChecksResult {
	monitorType: "pagespeed";
	groupedChecks: PageSpeedGroupedCheck[];
}

export interface HardwareChecksResult extends HardwareStats {
	monitorType: "hardware";
}

export interface DockerChecksResult extends DockerStats {
	monitorType: "docker";
}
