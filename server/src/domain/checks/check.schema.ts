import { z } from "zod";
import { MonitorTypes } from "@/domain/monitors/monitor.type.js";
import { EgressStatuses } from "@/domain/egress/egress.type.js";
import { dockerContainerInfoSchema, dockerContainerSummarySchema } from "@/domain/docker/docker.schema.js";
import { SmartDriveStatuses, SmartWarnings } from "@/domain/checks/check.type.js";

export const checkMetadataSchema = z.object({
	monitorId: z.string(),
	teamId: z.string(),
	type: z.enum(MonitorTypes),
});

export const checkTimingsSchema = z.object({
	start: z.number(),
	socket: z.number().optional(),
	lookup: z.number().optional(),
	connect: z.number().optional(),
	secureConnect: z.number().optional(),
	upload: z.number().optional(),
	response: z.number().optional(),
	end: z.number().optional(),
	phases: z.object({
		wait: z.number().optional(),
		dns: z.number().optional(),
		tcp: z.number().optional(),
		tls: z.number().optional(),
		request: z.number().optional(),
		firstByte: z.number().optional(),
		download: z.number().optional(),
		total: z.number().optional(),
	}),
});

export const checkCpuInfoSchema = z.object({
	physical_core: z.number().optional(),
	logical_core: z.number().optional(),
	frequency: z.number().optional(),
	current_frequency: z.number().optional(),
	temperature: z.array(z.number()).optional(),
	free_percent: z.number().optional(),
	usage_percent: z.number().optional(),
});

export const checkMemoryInfoSchema = z.object({
	total_bytes: z.number().optional(),
	available_bytes: z.number().optional(),
	used_bytes: z.number().optional(),
	usage_percent: z.number().optional(),
});

export const checkHostInfoSchema = z.object({
	os: z.string().optional(),
	platform: z.string().optional(),
	kernel_version: z.string().optional(),
	pretty_name: z.string().optional(),
});

export const checkCaptureInfoSchema = z.object({
	version: z.string().optional(),
	mode: z.string().optional(),
});

export const checkDiskInfoSchema = z.object({
	device: z.string().optional(),
	mountpoint: z.string().optional(),
	total_bytes: z.number().optional(),
	free_bytes: z.number().optional(),
	used_bytes: z.number().optional(),
	usage_percent: z.number().optional(),
	total_inodes: z.number().optional(),
	free_inodes: z.number().optional(),
	used_inodes: z.number().optional(),
	inodes_usage_percent: z.number().optional(),
	read_bytes: z.number().optional(),
	write_bytes: z.number().optional(),
	read_time: z.number().optional(),
	write_time: z.number().optional(),
});

export const checkErrorInfoSchema = z.object({
	metric: z.array(z.string()),
	err: z.string(),
});

// mdadm software RAID, sent by Capture inside /api/v1/metrics as data.raid (Linux only; [] without arrays).
// States are raw kernel md values, so they stay open strings.
export const checkRaidMemberSchema = z.object({
	device: z.string(),
	// Comma-separated md flags, e.g. "in_sync", "faulty,blocked". Match with includes, not equality.
	state: z.string(),
});

export const checkRaidArraySchema = z.object({
	device: z.string(),
	level: z.string(), // empty while the array is inactive
	state: z.string(), // md array_state: clean, active, read-auto, inactive, write-pending, ...
	raid_disks: z.number().nullable().optional(),
	// Missing members; 0 is healthy. Null for raid0/linear, which have no redundancy.
	degraded_disks: z.number().nullable().optional(),
	sync_action: z.string().nullable().optional(), // idle, resync, recover, check, repair, reshape, frozen
	sync_progress: z.number().nullable().optional(), // 0-1 while a sync runs
	members: z.array(checkRaidMemberSchema),
});

// One drive from Capture's /api/v1/metrics/smart. Key drives by serial_number: device paths change across reboots.
// Null counters mean "not reported" and must never be read as 0. The string fields keep Capture's legacy format
// ("38 Celsius", "3%", decimal strings, "" when absent).
export const checkDriveSchema = z.object({
	device: z.string(),
	type: z.string(),
	protocol: z.string(), // ATA, NVMe or SCSI; empty when the drive could not be read
	status: z.enum(SmartDriveStatuses),
	model_name: z.string(),
	serial_number: z.string(), // empty for standby, unsupported and error entries
	firmware_version: z.string(),
	capacity_bytes: z.number().nullable().optional(),
	warnings: z.array(z.enum(SmartWarnings)),
	reallocated_sectors: z.number().nullable().optional(),
	pending_sectors: z.number().nullable().optional(),
	offline_uncorrectable: z.number().nullable().optional(),
	media_errors: z.number().nullable().optional(), // NVMe only
	smart_overall_health_self_assessment_test_result: z.string(),
	temperature: z.string(),
	power_on_hours: z.string(),
	power_cycles: z.string(),
	unsafe_shutdowns: z.string(),
	percentage_used: z.string(),
	available_spare: z.string(),
	available_spare_threshold: z.string(),
	critical_warning: z.string(),
	data_units_read: z.string(),
	data_units_written: z.string(),
	host_read_commands: z.string(),
	host_write_commands: z.string(),
	controller_busy_time: z.string(),
});

export const checkNetworkInterfaceInfoSchema = z.object({
	name: z.string(),
	bytes_sent: z.number(),
	bytes_recv: z.number(),
	packets_sent: z.number(),
	packets_recv: z.number(),
	err_in: z.number(),
	err_out: z.number(),
	drop_in: z.number(),
	drop_out: z.number(),
	fifo_in: z.number(),
	fifo_out: z.number(),
});

export const lighthouseAuditSchema = z.object({
	id: z.string().optional(),
	title: z.string().optional(),
	score: z.number().nullable().optional(),
	displayValue: z.string().optional(),
	numericValue: z.number().optional(),
	numericUnit: z.string().optional(),
});

export const checkAuditsSchema = z.object({
	cls: lighthouseAuditSchema.optional(),
	si: lighthouseAuditSchema.optional(),
	fcp: lighthouseAuditSchema.optional(),
	lcp: lighthouseAuditSchema.optional(),
	tbt: lighthouseAuditSchema.optional(),
});

export const checkSchema = z
	.object({
		id: z.string(),
		metadata: checkMetadataSchema,
		status: z.boolean(),
		responseTime: z.number(),
		timings: checkTimingsSchema.optional(),
		statusCode: z.number(),
		message: z.string(),
		cpu: checkCpuInfoSchema.optional(),
		memory: checkMemoryInfoSchema.optional(),
		disk: z.array(checkDiskInfoSchema).optional(),
		host: checkHostInfoSchema.optional(),
		errors: z.array(checkErrorInfoSchema).optional(),
		capture: checkCaptureInfoSchema.optional(),
		containers: z.array(dockerContainerInfoSchema).optional(),
		containerSummary: dockerContainerSummarySchema.optional(),
		net: z.array(checkNetworkInterfaceInfoSchema).optional(),
		// Absent when Capture predates RAID support or the check failed; [] when the host has no arrays.
		raid: z.array(checkRaidArraySchema).optional(),
		// Only on checks where SMART was fetched (at most every 10 minutes). Absent means "not fetched this time",
		// not "no drives". SMART errors are kept in errors, under the SmartErrorMetrics metrics.
		drives: z.array(checkDriveSchema).optional(),
		accessibility: z.number().optional(),
		bestPractices: z.number().optional(),
		seo: z.number().optional(),
		performance: z.number().optional(),
		audits: checkAuditsSchema.optional(),
		// Set on failing checks while the egress check is enabled; absent otherwise.
		// "degraded": no reliability target was reachable (or the instance was already degraded), so the failure is not attributable to the target.
		// "ok": a reliability target was reachable.
		egressStatus: z.enum(EgressStatuses).optional(),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.meta({ id: "Check" });

export const checkSnapshotSchema = checkSchema
	.pick({
		// uptime charts and down check tooltips
		id: true,
		status: true,
		responseTime: true,
		statusCode: true,
		message: true,
		createdAt: true,
		// pagespeed
		accessibility: true,
		bestPractices: true,
		seo: true,
		performance: true,
		audits: true,
	})
	.extend({
		// hardware monitors only
		cpu: checkCpuInfoSchema
			.pick({ physical_core: true, logical_core: true, frequency: true, current_frequency: true, temperature: true, usage_percent: true })
			.optional(),
		memory: checkMemoryInfoSchema.pick({ total_bytes: true, used_bytes: true, usage_percent: true }).optional(),
		disk: z.array(checkDiskInfoSchema.pick({ device: true, mountpoint: true, total_bytes: true, used_bytes: true, usage_percent: true })).optional(),
		host: checkHostInfoSchema.pick({ os: true, platform: true, pretty_name: true }).optional(),
		raid: z.array(checkRaidArraySchema.pick({ device: true, state: true, degraded_disks: true, sync_action: true, sync_progress: true })).optional(),
		// docker only
		containerSummary: dockerContainerSummarySchema.optional(),
	});

export const checksPageSchema = z.object({
	checksCount: z.number(),
	checks: z.array(checkSchema),
});

export const checksSummarySchema = z.object({
	totalChecks: z.number(),
	downChecks: z.number(),
	degradedChecks: z.number(),
});

//****************************************
// Aggregation results
//****************************************

export const groupedCheckSchema = z.object({
	bucketDate: z.string(),
	avgResponseTime: z.number(),
	totalChecks: z.number(),
});

export const groupedUptimeCheckSchema = groupedCheckSchema.extend({
	avgDns: z.number(),
	avgTcp: z.number(),
	avgTls: z.number(),
	avgRequest: z.number(),
	avgFirstByte: z.number(),
	avgDownload: z.number(),
});

export const pageSpeedGroupedCheckSchema = z.object({
	bucketDate: z.string(),
	performance: z.number(),
	accessibility: z.number(),
	bestPractices: z.number(),
	seo: z.number(),
});

export const hardwareDiskStatsSchema = z.object({
	name: z.string(),
	readSpeed: z.number(),
	writeSpeed: z.number(),
	totalBytes: z.number(),
	freeBytes: z.number(),
	usagePercent: z.number(),
});

export const hardwareNetStatsSchema = z.object({
	name: z.string(),
	bytesSentPerSecond: z.number(),
	deltaBytesRecv: z.number(),
	deltaPacketsSent: z.number(),
	deltaPacketsRecv: z.number(),
	deltaErrIn: z.number(),
	deltaErrOut: z.number(),
	deltaDropIn: z.number(),
	deltaDropOut: z.number(),
	deltaFifoIn: z.number(),
	deltaFifoOut: z.number(),
});

export const hardwareCheckStatsSchema = z.object({
	bucketDate: z.string(),
	avgCpuUsage: z.number(),
	avgMemoryUsage: z.number(),
	avgTemperature: z.array(z.number()),
	disks: z.array(hardwareDiskStatsSchema),
	net: z.array(hardwareNetStatsSchema),
});

export const hardwareStatsSchema = z.object({
	aggregateData: z.object({ totalChecks: z.number() }),
	upChecks: z.object({ totalChecks: z.number() }),
	checks: z.array(hardwareCheckStatsSchema),
});

// Storage health for the hardware details page. latestRaid is null until a check carries data.raid (older Capture);
// latestDrives is null until a SMART fetch returned per-drive data.
export const latestRaidSchema = z.object({
	arrays: z.array(checkRaidArraySchema),
	checkedAt: z.string(),
});

export const latestDriveSchema = checkDriveSchema.extend({
	// Set on standby drives whose identity and values were filled from the last reading of the same device that
	// had a serial. Absent when the values are from this fetch.
	lastKnownAt: z.string().optional(),
});

export const latestDrivesSchema = z.object({
	drives: z.array(latestDriveSchema),
	errors: z.array(checkErrorInfoSchema), // SMART errors from the same fetch, e.g. "smartctl is not installed"
	checkedAt: z.string(),
});

// Counters are the bucket maximum (they only grow), temperature the bucket average in Celsius. Null when no
// reading in the bucket reported the value.
export const driveHistoryPointSchema = z.object({
	bucketDate: z.string(),
	reallocated_sectors: z.number().nullable(),
	pending_sectors: z.number().nullable(),
	offline_uncorrectable: z.number().nullable(),
	media_errors: z.number().nullable(),
	temperature: z.number().nullable(),
});

export const driveHistorySchema = z.object({
	serial_number: z.string(),
	points: z.array(driveHistoryPointSchema),
});

export const dailyCheckBucketSchema = z.object({
	monitorId: z.string(),
	date: z.string(),
	totalChecks: z.number(),
	upChecks: z.number(),
	downChecks: z.number(),
	avgResponseTime: z.number().nullable(),
});

// The avg fields are null for buckets with no values ($avg skips missing; down checks store no containerSummary).
export const dockerStatsBucketSchema = z.object({
	_id: z.string(),
	avgResponseTime: z.number().nullable(),
	upCount: z.number(),
	totalCount: z.number(),
	avgRunning: z.number().nullable(),
	avgTotal: z.number().nullable(),
	avgUnhealthy: z.number().nullable(),
});

export const dockerStatsSchema = z.object({
	aggregateData: z.object({ totalChecks: z.number() }),
	upChecks: z.object({ totalChecks: z.number() }),
	aggregate: z.array(dockerStatsBucketSchema),
	latest: z
		.object({
			containers: z.array(dockerContainerInfoSchema),
			summary: dockerContainerSummarySchema.optional(),
			checkedAt: z.string(),
		})
		.nullable(),
});

export const dockerContainerStatsBucketSchema = z.object({
	_id: z.string(),
	avgCpuPct: z.number().nullable(),
	avgMemoryUsedBytes: z.number().nullable(),
	avgMemoryPct: z.number().nullable(),
	minRestartCount: z.number().nullable(),
	maxRestartCount: z.number().nullable(),
});

export const dockerContainerStatsSchema = z.object({
	aggregate: z.array(dockerContainerStatsBucketSchema),
	restartsInRange: z.number(),
	latest: z
		.object({
			container: dockerContainerInfoSchema,
			checkedAt: z.string(),
		})
		.nullable(),
});
