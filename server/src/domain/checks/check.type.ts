import type { z } from "zod";
import type { MonitorType } from "@/domain/monitors/monitor.type.js";
import type {
	checkAuditsSchema,
	checkCaptureInfoSchema,
	checkCpuInfoSchema,
	checkDiskInfoSchema,
	checkDriveSchema,
	checkErrorInfoSchema,
	checkHostInfoSchema,
	checkMemoryInfoSchema,
	checkMetadataSchema,
	checkNetworkInterfaceInfoSchema,
	checkRaidArraySchema,
	checkRaidMemberSchema,
	checkSchema,
	checkSnapshotSchema,
	checksPageSchema,
	checksSummarySchema,
	checkTimingsSchema,
	dailyCheckBucketSchema,
	dockerContainerStatsBucketSchema,
	dockerContainerStatsSchema,
	dockerStatsBucketSchema,
	dockerStatsSchema,
	driveHistorySchema,
	groupedCheckSchema,
	groupedUptimeCheckSchema,
	hardwareCheckStatsSchema,
	hardwareDiskStatsSchema,
	hardwareNetStatsSchema,
	hardwareStatsSchema,
	latestDrivesSchema,
	latestRaidSchema,
	lighthouseAuditSchema,
	pageSpeedGroupedCheckSchema,
} from "@/domain/checks/check.schema.js";

export const CHECK_TTL_SENTINEL = 366;

// Per-drive SMART status as reported by Capture: ok (values present), standby (asleep, not woken, no identity or
// values), unsupported (no SMART, e.g. virtual disks), error (could not read; the reason is in the response errors).
export const SmartDriveStatuses = ["ok", "standby", "unsupported", "error"] as const;
export type SmartDriveStatus = (typeof SmartDriveStatuses)[number];

// Closed set derived from smartctl's exit status bits. It does not say which attribute crossed a threshold.
export const SmartWarnings = [
	"disk_failing",
	"prefail_attribute_at_threshold",
	"attribute_was_at_threshold",
	"error_log_has_errors",
	"self_test_log_has_errors",
] as const;
export type SmartWarning = (typeof SmartWarnings)[number];

// Error metrics Capture and the SMART fetch use; they tell SMART errors apart from the main metrics' errors on a check.
export const SmartErrorMetrics = ["smart", "smartctl"] as const;
export type CheckTimings = z.infer<typeof checkTimingsSchema>;
export type CheckMetadata = z.infer<typeof checkMetadataSchema>;
export type CheckCpuInfo = z.infer<typeof checkCpuInfoSchema>;
export type CheckMemoryInfo = z.infer<typeof checkMemoryInfoSchema>;
export type CheckHostInfo = z.infer<typeof checkHostInfoSchema>;
export type CheckCaptureInfo = z.infer<typeof checkCaptureInfoSchema>;
export type CheckDiskInfo = z.infer<typeof checkDiskInfoSchema>;
export type CheckErrorInfo = z.infer<typeof checkErrorInfoSchema>;
export type CheckRaidMember = z.infer<typeof checkRaidMemberSchema>;
export type CheckRaidArray = z.infer<typeof checkRaidArraySchema>;
export type CheckDrive = z.infer<typeof checkDriveSchema>;
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
export type SnapshotRaidArray = NonNullable<CheckSnapshot["raid"]>[number];

export type GroupedCheck = z.infer<typeof groupedCheckSchema>;
export type GroupedUptimeCheck = z.infer<typeof groupedUptimeCheckSchema>;
export type PageSpeedGroupedCheck = z.infer<typeof pageSpeedGroupedCheckSchema>;
export type HardwareDiskStats = z.infer<typeof hardwareDiskStatsSchema>;
export type HardwareNetStats = z.infer<typeof hardwareNetStatsSchema>;
export type HardwareCheckStats = z.infer<typeof hardwareCheckStatsSchema>;
export type HardwareStats = z.infer<typeof hardwareStatsSchema>;
export type LatestRaid = z.infer<typeof latestRaidSchema>;
export type LatestDrives = z.infer<typeof latestDrivesSchema>;
export type DriveHistory = z.infer<typeof driveHistorySchema>;
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
