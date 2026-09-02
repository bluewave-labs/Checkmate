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
} from "@/domain/checks/check.type.js";
import type { DnsRecordType, Monitor, MonitorMatchMethod, MonitorStatus, MonitorType } from "@/domain/monitors/monitor.type.js";

import type { QueryResult } from "gamedig";

export const NETWORK_ERROR = 5000;

export interface MonitorStatusResponse<
	T =
		| HttpStatusPayload
		| PingStatusPayload
		| PageSpeedStatusPayload
		| HardwareStatusPayload
		| DockerStatusPayload
		| GameStatusPayload
		| GrpcStatusPayload
		| WebSocketStatusPayload,
> {
	monitorId: string;
	teamId: string;
	type: MonitorType;
	status: boolean;
	code: number;
	message: string;
	responseTime?: number;
	payload?: T | string | null;
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
	time: number | unknown;
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

// Docker host monitoring
export const DockerContainerStates = ["created", "running", "paused", "restarting", "removing", "exited", "dead"] as const;
export type DockerContainerState = (typeof DockerContainerStates)[number];

export const DockerHealthStatuses = ["healthy", "unhealthy", "starting", "none"] as const;
export type DockerHealthStatus = (typeof DockerHealthStatuses)[number];

export const DockerLogStreams = ["stdout", "stderr"] as const;
export type DockerLogStream = (typeof DockerLogStreams)[number];
export interface DockerLogLine {
	ts: string;
	stream: DockerLogStream;
	text: string;
}

export interface DockerContainerLogs {
	containerId: string;
	containerName: string;
	lines: DockerLogLine[];
}

export interface DockerContainerSummary {
	total: number;
	running: number;
	stopped: number;
	unhealthy: number;
}

export interface DockerContainerInfo {
	id: string;
	name: string;
	image: string;
	state: DockerContainerState;
	status: string;
	health: DockerHealthStatus;
	cpuPct?: number; // fraction of one core (docker stats convention / 100); exceeds 1 when using multiple cores
	memoryUsedBytes?: number;
	memoryLimitBytes?: number;
	memoryPct?: number; // 0-1 fraction of the memory limit
	restartCount?: number;
	startedAt?: string; // ISO date
	ports?: DockerContainerPort[];
	mounts?: DockerContainerMount[];
}

export const DockerPortProtocols = ["tcp", "udp", "sctp"] as const;
export type DockerPortProtocol = (typeof DockerPortProtocols)[number];

export interface DockerContainerPort {
	privatePort: number;
	protocol: DockerPortProtocol;
	publicPort?: number;
	hostIp?: string;
}

export interface DockerContainerMount {
	type: string; // open set: bind, volume, tmpfs, image, npipe, cluster, …
	name?: string;
	source: string;
	destination: string;
	mode: string;
	rw: boolean;
}

export interface DockerStatusPayload {
	containers: DockerContainerInfo[];
	summary: DockerContainerSummary;
	logs?: DockerContainerLogs[];
}

export interface PortStatusPayload {
	success: boolean;
}

export type GameStatusPayload = QueryResult;

export interface GrpcStatusPayload {
	grpcStatusCode: number;
	grpcStatusName: string;
	serviceName: string;
	servingStatus: string;
}

export interface WebSocketStatusPayload {
	connected: boolean;
}

export interface DNSStatusPayload {
	hostname: string;
	dnsServer: string;
	recordType: DnsRecordType;
	resolved: boolean;
	results: unknown;
}

export interface MonitorPayloadMap {
	ping: PingStatusPayload;
	http: HttpStatusPayload;
	pagespeed: PageSpeedStatusPayload;
	hardware: HardwareStatusPayload;
	docker: DockerStatusPayload;
	port: PortStatusPayload;
	game: GameStatusPayload;
	grpc: GrpcStatusPayload;
	websocket: WebSocketStatusPayload;
	dns: DNSStatusPayload;
	unknown: unknown;
}

export type StatusChangeResult = {
	monitor: Monitor;
	statusChanged: boolean;
	prevStatus: MonitorStatus;
	code: number;
	timestamp: number;
	thresholdBreaches?: {
		cpu: boolean;
		memory: boolean;
		disk: boolean;
		temp: boolean;
	};
};

export type MonitorStatusResponseOverrides<T> = Partial<Omit<MonitorStatusResponse<T>, "monitorId" | "teamId" | "type">>;

export type CheckContext = {
	proxyUrl?: string;
};
