import type { EgressStatus } from "@/Types/Egress";

export const CHECK_TTL_SENTINEL = 366;

export interface CheckMetadata {
	monitorId: string;
	teamId: string;
	type:
		| "http"
		| "ping"
		| "pagespeed"
		| "hardware"
		| "docker"
		| "port"
		| "game"
		| "unknown";
}

export interface CheckCpuInfo {
	physical_core?: number;
	logical_core?: number;
	frequency?: number;
	current_frequency?: number;
	temperature?: number[];
	free_percent?: number;
	usage_percent?: number;
}

export interface CheckMemoryInfo {
	total_bytes?: number;
	available_bytes?: number;
	used_bytes?: number;
	usage_percent?: number;
}

export interface CheckHostInfo {
	os?: string;
	platform?: string;
	kernel_version?: string;
	pretty_name?: string;
}

export interface CheckCaptureInfo {
	version?: string;
	mode?: string;
}

export interface CheckDiskInfo {
	device?: string;
	mountpoint?: string;
	total_bytes?: number;
	free_bytes?: number;
	used_bytes?: number;
	usage_percent?: number;
	total_inodes?: number;
	free_inodes?: number;
	used_inodes?: number;
	inodes_usage_percent?: number;
	read_bytes?: number;
	write_bytes?: number;
	read_time?: number;
	write_time?: number;
}

export interface CheckErrorInfo {
	metric: string[];
	err: string;
}

export interface CheckNetworkInterfaceInfo {
	name: string;
	bytes_sent: number;
	bytes_recv: number;
	packets_sent: number;
	packets_recv: number;
	err_in: number;
	err_out: number;
	drop_in: number;
	drop_out: number;
	fifo_in: number;
	fifo_out: number;
}

export interface CheckAudits {
	cls?: ILighthouseAudit;
	si?: ILighthouseAudit;
	fcp?: ILighthouseAudit;
	lcp?: ILighthouseAudit;
	tbt?: ILighthouseAudit;
}

export interface ILighthouseAudit {
	id?: string;
	title?: string;
	score?: number | null;
	displayValue?: string;
	numericValue?: number;
	numericUnit?: string;
}

export interface CheckTimings {
	start?: number;
	socket?: number;
	lookup?: number;
	connect?: number;
	secureConnect?: number;
	upload?: number;
	response?: number;
	end?: number;
	abort?: number;
	error?: number;
	phases?: {
		wait?: number;
		dns?: number;
		tcp?: number;
		tls?: number;
		request?: number;
		firstByte?: number;
		download?: number;
		total?: number;
	};
}

// Mirrors checkRaidMemberSchema / checkRaidArraySchema in server/src/domain/checks/check.schema.ts.
// States are raw kernel md values, so they stay open strings.
export interface CheckRaidMember {
	device: string;
	// Comma-separated md flags, e.g. "in_sync", "faulty,blocked". Match with includes, not equality.
	state: string;
}

export interface CheckRaidArray {
	device: string;
	level: string;
	state: string;
	raid_disks?: number | null;
	degraded_disks?: number | null;
	sync_action?: string | null;
	sync_progress?: number | null;
	members: CheckRaidMember[];
}

export type SnapshotRaidArray = Pick<
	CheckRaidArray,
	"device" | "state" | "degraded_disks" | "sync_action" | "sync_progress"
>;

// Mirrors SmartDriveStatuses / SmartWarnings in server/src/domain/checks/check.type.ts.
export const SmartDriveStatuses = ["ok", "standby", "unsupported", "error"] as const;
export type SmartDriveStatus = (typeof SmartDriveStatuses)[number];

export const SmartWarnings = [
	"disk_failing",
	"prefail_attribute_at_threshold",
	"attribute_was_at_threshold",
	"error_log_has_errors",
	"self_test_log_has_errors",
] as const;
export type SmartWarning = (typeof SmartWarnings)[number];

// Mirrors checkDriveSchema. Null counters mean "not reported", never 0. String fields keep Capture's
// legacy format ("38 Celsius", "3%", decimal strings, "" when absent).
export interface CheckDrive {
	device: string;
	type: string;
	protocol: string;
	status: SmartDriveStatus;
	model_name: string;
	serial_number: string;
	firmware_version: string;
	capacity_bytes?: number | null;
	warnings: SmartWarning[];
	reallocated_sectors?: number | null;
	pending_sectors?: number | null;
	offline_uncorrectable?: number | null;
	media_errors?: number | null;
	smart_overall_health_self_assessment_test_result: string;
	temperature: string;
	power_on_hours: string;
	power_cycles: string;
	unsafe_shutdowns: string;
	percentage_used: string;
	available_spare: string;
	available_spare_threshold: string;
	critical_warning: string;
	data_units_read: string;
	data_units_written: string;
	host_read_commands: string;
	host_write_commands: string;
	controller_busy_time: string;
}

// Mirrors DockerContainerSummary in server/src/types/network.ts.
export interface DockerContainerSummary {
	total: number;
	running: number;
	stopped: number;
	unhealthy: number;
}

// Mirrors DockerContainerStates in server/src/types/network.ts.
export const DockerContainerStates = [
	"created",
	"running",
	"paused",
	"restarting",
	"removing",
	"exited",
	"dead",
] as const;
export type DockerContainerState = (typeof DockerContainerStates)[number];

export const DockerHealthStatuses = ["healthy", "unhealthy", "starting", "none"] as const;
export type DockerHealthStatus = (typeof DockerHealthStatuses)[number];

export const DockerPortProtocols = ["tcp", "udp", "sctp"] as const;
export type DockerPortProtocol = (typeof DockerPortProtocols)[number];

export interface DockerContainerPort {
	privatePort: number;
	protocol: DockerPortProtocol;
	publicPort?: number;
	hostIp?: string;
}

export interface DockerContainerMount {
	type: string;
	name?: string;
	source: string;
	destination: string;
	mode: string;
	rw: boolean;
}

export const DockerLogStreams = ["stdout", "stderr"] as const;
export type DockerLogStream = (typeof DockerLogStreams)[number];

export interface DockerLogLine {
	ts: string;
	stream: DockerLogStream;
	text: string;
}

export interface DockerLog {
	id: string;
	metadata: {
		monitorId: string;
		teamId: string;
		containerId: string;
		containerName: string;
	};
	lines: DockerLogLine[];
	gap: boolean;
	checkedAt: string;
	expiry: string;
	createdAt: string;
	updatedAt: string;
}

export interface DockerContainerInfo {
	id: string;
	name: string;
	image: string;
	state: DockerContainerState;
	status: string;
	health: DockerHealthStatus;
	cpuPct?: number;
	memoryUsedBytes?: number;
	memoryLimitBytes?: number;
	memoryPct?: number;
	restartCount?: number;
	startedAt?: string;
	ports?: DockerContainerPort[];
	mounts?: DockerContainerMount[];
}

export interface Check {
	id: string;
	metadata: CheckMetadata;
	status: boolean;
	responseTime: number;
	timings?: CheckTimings;
	statusCode: number;
	message: string;
	cpu?: CheckCpuInfo;
	memory?: CheckMemoryInfo;
	disk?: CheckDiskInfo[];
	host?: CheckHostInfo;
	errors?: CheckErrorInfo[];
	capture?: CheckCaptureInfo;
	containerSummary?: DockerContainerSummary;
	raid?: CheckRaidArray[];
	drives?: CheckDrive[];
	net?: CheckNetworkInterfaceInfo[];
	accessibility?: number;
	bestPractices?: number;
	seo?: number;
	performance?: number;
	audits?: CheckAudits;
	egressStatus?: EgressStatus;
	createdAt: string;
	updatedAt: string;
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
	totalChecks: number;
}

export interface LatestCheck {
	status: boolean;
	responseTime: number;
	checkedAt: string;
	id: string;
}

export interface ChecksResponse {
	checks: Check[];
	checksCount: number;
}

export type MonitorType =
	| "http"
	| "ping"
	| "pagespeed"
	| "hardware"
	| "docker"
	| "port"
	| "game"
	| "unknown";

export interface ChecksQueryResult {
	checksCount: number;
	checks: Check[];
}

export interface PageSpeedChecksResult {
	monitorType: "pagespeed";
	checks: Check[];
}

export interface HardwareChecksResult {
	monitorType: "hardware";
	aggregateData: {
		totalChecks: number;
	};
	upChecks: {
		totalChecks: number;
	};
	checks: Array<{
		bucketDate: string;
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
	groupedChecks: GroupedCheck[];
	groupedUpChecks: GroupedCheck[];
	groupedDownChecks: GroupedCheck[];
	uptimePercentage: number;
	avgResponseTime: number;
}

export interface ChecksSummary {
	totalChecks: number;
	downChecks: number;
	degradedChecks: number;
}

export type SnapshotCpuInfo = Pick<
	CheckCpuInfo,
	| "physical_core"
	| "logical_core"
	| "frequency"
	| "current_frequency"
	| "temperature"
	| "usage_percent"
>;
export type SnapshotMemoryInfo = Pick<
	CheckMemoryInfo,
	"total_bytes" | "used_bytes" | "usage_percent"
>;
export type SnapshotDiskInfo = Pick<
	CheckDiskInfo,
	"device" | "mountpoint" | "total_bytes" | "used_bytes" | "usage_percent"
>;
export type SnapshotHostInfo = Pick<CheckHostInfo, "os" | "platform" | "pretty_name">;

export type CheckSnapshot = Pick<
	Check,
	| "id"
	| "status"
	| "responseTime"
	| "statusCode"
	| "message"
	| "createdAt"
	| "accessibility"
	| "bestPractices"
	| "seo"
	| "performance"
	| "audits"
> & {
	cpu?: SnapshotCpuInfo;
	memory?: SnapshotMemoryInfo;
	disk?: SnapshotDiskInfo[];
	host?: SnapshotHostInfo;
	containerSummary?: DockerContainerSummary;
	raid?: SnapshotRaidArray[];
};
export interface HasResponseTime {
	responseTime: number;
}

export interface DailyCheckBucket {
	monitorId: string;
	date: string;
	totalChecks: number;
	upChecks: number;
	downChecks: number;
	avgResponseTime: number | null; // null when no check that day recorded a response time
}
