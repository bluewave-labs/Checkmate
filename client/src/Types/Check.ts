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

export interface Check {
	id: string;
	metadata: CheckMetadata;
	status: boolean;
	responseTime: number;
	timings?: CheckTimings;
	statusCode: number;
	message: string;
	expiry: string;
	cpu?: CheckCpuInfo;
	memory?: CheckMemoryInfo;
	disk?: CheckDiskInfo[];
	host?: CheckHostInfo;
	errors?: CheckErrorInfo[];
	capture?: CheckCaptureInfo;
	net?: CheckNetworkInterfaceInfo[];
	accessibility?: number;
	bestPractices?: number;
	seo?: number;
	performance?: number;
	audits?: CheckAudits;
	__v: number;
	createdAt: string;
	updatedAt: string;
}

export interface GroupedCheck {
	bucketDate: string;
	avgResponseTime: number;
	totalChecks: number;
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
}

export type CheckSnapshot = Omit<Check, "metadata" | "expiry" | "__v" | "updatedAt"> & {
	originalResponseTime: number;
};

export interface HasResponseTime {
	responseTime: number;
}

export type NormalizedCheck<T extends HasResponseTime = Check> = T & {
	originalResponseTime: number;
};

export type NormalizedUptimeCheck<T extends GroupedCheck = GroupedCheck> = T & {
	originalAvgResponseTime: number;
};
