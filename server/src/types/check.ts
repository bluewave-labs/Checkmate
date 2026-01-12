import type { MonitorType } from "@/types/index.js";

export interface CheckTimingPhases {
	wait: number;
	dns: number;
	tcp: number;
	tls: number;
	request: number;
	firstByte: number;
	download: number;
	total: number;
}

export interface CheckTimings {
	start: number;
	socket: number;
	lookup: number;
	connect: number;
	secureConnect: number;
	upload: number;
	response: number;
	end: number;
	phases: CheckTimingPhases;
}

export interface CheckCpuInfo {
	physical_core: number;
	logical_core: number;
	frequency: number;
	temperature: number[];
	free_percent: number;
	usage_percent: number;
}

export interface CheckMemoryInfo {
	total_bytes: number;
	available_bytes: number;
	used_bytes: number;
	usage_percent: number;
}

export interface CheckHostInfo {
	os: string;
	platform: string;
	kernel_version: string;
}

export interface CheckCaptureInfo {
	version: string;
	mode: string;
}

export interface CheckDiskInfo {}

export interface CheckNetInfo {}

export interface Check {
	id: string;
	monitorId: string;
	teamId: string;
	type: MonitorType;
	status: boolean;
	responseTime: number;
	timings: CheckTimings;
	statusCode: number;
	message: string;
	ack: boolean;
	expiry: string;
	cpu: CheckCpuInfo;
	memory: CheckMemoryInfo;
	disk: CheckDiskInfo[];
	host: CheckHostInfo;
	errors: string[];
	capture: CheckCaptureInfo;
	net: CheckNetInfo[];
	__v: number;
	createdAt: string;
	updatedAt: string;
}
