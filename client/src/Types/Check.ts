export interface CheckMetadata {
	monitorId: string;
	teamId: string;
	type: "http" | "ping" | "pagespeed" | "hardware" | "docker" | "port" | "game" | "unknown";
}

export interface CheckCpuInfo {
	physical_core?: number;
	logical_core?: number;
	frequency?: number;
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
}

export interface CheckCaptureInfo {
	version?: string;
	mode?: string;
}

export interface CheckDiskInfo {
	device?: string;
	mountpoint?: string;
	read_speed_bytes?: number;
	write_speed_bytes?: number;
	total_bytes?: number;
	free_bytes?: number;
	usage_percent?: number;
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
	ack: boolean;
	ackAt?: string | null;
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

export type CheckSnapshot = Omit<Check, "metadata" | "ack" | "ackAt" | "expiry" | "__v" | "updatedAt">;

export interface HasResponseTime {
	responseTime: number;
}

export type NormalizedCheck<T extends HasResponseTime = Check> = T & {
	originalResponseTime: number;
};

export type NormalizedUptimeCheck<T extends GroupedCheck = GroupedCheck> = T & {
	originalAvgResponseTime: number;
};
