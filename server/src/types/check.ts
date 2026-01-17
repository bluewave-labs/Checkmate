import type { MonitorType } from "@/types/index.js";
import type { Response } from "got";
export type GotTimings = Response["timings"];

export interface CheckMetadata {
	monitorId: string;
	teamId: string;
	type: MonitorType;
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

export interface CheckContainerInfo {
	vmid: string;
	name: string;
	node: string;
	status: string;
	type: string;
	uptime: number;
	cpu_cores: number;
	cpu_usage: number;
	memory_used: number;
	memory_total: number;
	memory_usage: number;
	swap_used: number;
	swap_total: number;
	disk_used: number;
	disk_total: number;
	disk_read: number;
	disk_write: number;
	network_in: number;
	network_out: number;
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

export interface Check {
	id: string;
	metadata: CheckMetadata;
	status: boolean;
	responseTime: number;
	timings?: GotTimings;
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
	containers?: CheckContainerInfo[];
	accessibility?: number;
	bestPractices?: number;
	seo?: number;
	performance?: number;
	audits?: CheckAudits;
	__v: number;
	createdAt: string;
	updatedAt: string;
}
