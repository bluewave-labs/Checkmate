import type {
	CheckCaptureInfo,
	CheckCpuInfo,
	CheckDiskInfo,
	CheckErrorInfo,
	CheckHostInfo,
	CheckMemoryInfo,
	CheckNetworkInterfaceInfo,
	GotTimings,
	ILighthouseAudit,
	Monitor,
	MonitorMatchMethod,
	MonitorType,
} from "@/types/index.js";

export interface MonitorStatusResponse<T = any> {
	monitorId: string;
	teamId: string;
	type: MonitorType;
	status: boolean;
	code: number;
	message: string;
	responseTime?: number;
	payload?: T | null;
	timings?: GotTimings;
	first_byte_took?: number;
	body_read_took?: number;
	dns_took?: number;
	conn_took?: number;
	connect_took?: number;
	tls_took?: number;
	jsonPath?: string;
	matchMethod?: MonitorMatchMethod;
	expectedValue?: string;
	extracted?: unknown;
}

export interface PingStatusPayload {
	host: string;
	numeric_host?: string;
	alive: boolean;
	time: number;
	times?: number[];
	output?: string;
	min?: string;
	max?: string;
	avg?: string;
	stddev?: string;
	packetLoss?: string;
}

export type HttpStatusPayload = unknown;

export interface PageSpeedCategoryScore {
	score?: number | null;
}

export interface PageSpeedStatusPayload {
	lighthouseResult?: {
		categories?: {
			accessibility?: PageSpeedCategoryScore;
			"best-practices"?: PageSpeedCategoryScore;
			performance?: PageSpeedCategoryScore;
			seo?: PageSpeedCategoryScore;
			[key: string]: PageSpeedCategoryScore | undefined;
		};
		audits?: Record<string, ILighthouseAudit | undefined>;
	};
	[key: string]: unknown;
}

export interface HardwareStatusMetrics {
	cpu?: CheckCpuInfo;
	memory?: CheckMemoryInfo;
	disk?: CheckDiskInfo[];
	host?: CheckHostInfo;
	net?: CheckNetworkInterfaceInfo[];
}

export interface HardwareStatusPayload {
	data?: HardwareStatusMetrics;
	errors?: CheckErrorInfo[] | { errors?: CheckErrorInfo[] };
	capture?: CheckCaptureInfo;
	[key: string]: unknown;
}

export type DockerStatusPayload = Record<string, unknown>;

export interface PortStatusPayload {
	success: boolean;
}

export type GameStatusPayload = Record<string, unknown>;

export interface MonitorPayloadMap {
	ping: PingStatusPayload;
	http: HttpStatusPayload;
	pagespeed: PageSpeedStatusPayload;
	hardware: HardwareStatusPayload;
	docker: DockerStatusPayload;
	port: PortStatusPayload;
	game: GameStatusPayload;
	default: unknown;
}

export type StatusChangeResult = {
	monitor: Monitor;
	statusChanged: boolean;
	prevStatus: boolean | undefined;
	code: number;
	timestamp: number;
};
