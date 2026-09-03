import type {
	GroupedCheck,
	CheckSnapshot,
	GroupedUptimeCheck,
	DailyCheckBucket,
	DockerContainerInfo,
	DockerContainerSummary,
} from "@/Types/Check";
import type { PageSpeedGroupedCheck } from "@/Types/Check";
import type { GeoContinent } from "@/Types/GeoCheck";
export type { GeoContinent } from "@/Types/GeoCheck";

export const MAX_RECENT_CHECKS = 50;

export const MonitorTypes = [
	"http",
	"ping",
	"pagespeed",
	"hardware",
	"docker",
	"port",
	"game",
	"grpc",
	"websocket",
	"dns",
	"unknown",
] as const;
export type MonitorType = (typeof MonitorTypes)[number];

// The subset offered by the CreateMonitor type selector, in display order.
// pagespeed/hardware are set by their own pages; unknown is never selectable.
export const SelectableMonitorTypes = [
	"http",
	"ping",
	"port",
	"game",
	"grpc",
	"websocket",
	"dns",
] as const;
export type SelectableMonitorType = (typeof SelectableMonitorTypes)[number];

// Irregular i18n key fragments shared by the type selector's label
// (pages.common.monitors.monitorTypes.<fragment>), its description
// (pages.createMonitor.form.type.<fragment>Description), and status page
// type labels (via getMonitorTypeLabel). Covers every type with a label;
// only selectable types have description keys.
export const monitorTypeLabelKey: Record<SelectableMonitorType, string> &
	Partial<Record<MonitorType, string>> = {
	http: "optionHttp",
	ping: "optionPing",
	docker: "optionDocker",
	port: "optionPort",
	game: "optionGame",
	grpc: "optionGrpc",
	websocket: "optionWebSocket",
	dns: "optionDns",
	hardware: "optionHardware",
	pagespeed: "optionPagespeed",
};

export const MIN_MONITOR_INTERVAL_MS = 10000;

export const MonitorIntervalOptions = [
	{ value: 15000, labelKey: "fifteenSeconds" },
	{ value: 30000, labelKey: "thirtySeconds" },
	{ value: 60000, labelKey: "oneMinute" },
	{ value: 120000, labelKey: "twoMinutes" },
	{ value: 180000, labelKey: "threeMinutes" },
	{ value: 240000, labelKey: "fourMinutes" },
	{ value: 300000, labelKey: "fiveMinutes" },
	{ value: 600000, labelKey: "tenMinutes" },
	{ value: 900000, labelKey: "fifteenMinutes" },
	{ value: 1800000, labelKey: "thirtyMinutes" },
] as const;

export const GeoCheckIntervalOptions = MonitorIntervalOptions.filter(
	({ value }) => value >= 300000
);

export const DnsRecordTypes = ["A", "AAAA", "CNAME", "MX", "TXT", "NS"] as const;
export type DnsRecordType = (typeof DnsRecordTypes)[number];

export const GeoCheckSupportedTypes: readonly MonitorType[] = ["http", "ping"] as const;

export const supportsGeoCheck = (type: MonitorType | undefined): boolean => {
	if (!type) {
		return false;
	}
	return GeoCheckSupportedTypes.includes(type);
};

export const MonitorStatuses = [
	"up",
	"down",
	"paused",
	"initializing",
	"maintenance",
	"breached",
] as const;
export type MonitorStatus = (typeof MonitorStatuses)[number];

export const MonitorMatchMethods = ["equal", "include", "regex"] as const;
export type MonitorMatchMethod = (typeof MonitorMatchMethods)[number] | "";
export const DefaultMonitorMatchMethod: MonitorMatchMethod = "equal";

export const PageSpeedStrategies = ["desktop", "mobile"] as const;
export type PageSpeedStrategy = (typeof PageSpeedStrategies)[number];
export const DefaultPageSpeedStrategy: PageSpeedStrategy = "desktop";

export const HttpMethods = ["GET", "HEAD"] as const;
export type HttpMethod = (typeof HttpMethods)[number];
export const DefaultHttpMethod: HttpMethod = "GET";

export const ProxyModes = ["inherit", "none", "custom"] as const;
export type ProxyMode = (typeof ProxyModes)[number];
export const DefaultProxyMode: ProxyMode = "inherit";

export interface Monitor {
	id: string;
	userId: string;
	teamId: string;
	name: string;
	description?: string;
	status: MonitorStatus;
	statusWindow: boolean[];
	statusWindowSize: number;
	statusWindowThreshold: number;
	type: MonitorType;
	ignoreTlsErrors: boolean;
	proxyMode: ProxyMode;
	proxyId?: string;
	useAdvancedMatching: boolean;
	jsonPath?: string;
	expectedValue?: string;
	matchMethod?: MonitorMatchMethod;
	method?: HttpMethod;
	url: string;
	port?: number;
	isActive: boolean;
	interval: number;
	uptimePercentage?: number;
	notifications: string[];
	tags: string[];
	customUpCodes?: number[];
	secret?: string;
	cpuAlertThreshold: number;
	cpuAlertCounter: number;
	memoryAlertThreshold: number;
	memoryAlertCounter: number;
	diskAlertThreshold: number;
	diskAlertCounter: number;
	tempAlertThreshold: number;
	tempAlertCounter: number;
	selectedDisks: string[];
	gameId?: string;
	grpcServiceName?: string;
	strategy?: PageSpeedStrategy;
	group: string | null;
	geoCheckEnabled?: boolean;
	geoCheckLocations?: GeoContinent[];
	geoCheckInterval?: number;
	dnsServer?: string;
	dnsRecordType?: DnsRecordType;
	recentChecks: CheckSnapshot[];
	dailyChecks?: DailyCheckBucket[];
	createdAt: string;
	updatedAt: string;
}

export type MonitorWithChecks = Monitor;

export interface MonitorsSummary {
	totalMonitors: number;
	upMonitors: number;
	downMonitors: number;
	pausedMonitors: number;
	initializingMonitors: number;
	maintenanceMonitors: number;
	breachedMonitors: number;
}

export interface MonitorsWithChecksResponse {
	count: number;
	monitors: MonitorWithChecks[];
	summary: MonitorsSummary | null;
}

export interface MonitorStats {
	id: string;
	monitorId: string;
	avgResponseTime: number;
	maxResponseTime: number;
	totalChecks: number;
	totalUpChecks: number;
	totalDownChecks: number;
	uptimePercentage: number;
	lastCheckTimestamp: number;
	lastResponseTime: number;
	timeOfLastFailure?: number;
	createdAt: string;
	updatedAt: string;
}

export interface MonitorData {
	monitor: Monitor;
	groupedChecks: GroupedUptimeCheck[];
	groupedUpChecks: GroupedCheck[];
	groupedDownChecks: GroupedCheck[];
	groupedAvgResponseTime: number;
	groupedUptimePercentage: number;
}

export interface MonitorDetailsResponse {
	monitorData: MonitorData;
	monitorStats: MonitorStats | null;
}

export interface PageSpeedDetailsResponse {
	monitorData: {
		monitor: Monitor;
		groupedChecks: PageSpeedGroupedCheck[];
	};
	monitorStats: MonitorStats | null;
}

export interface HardwareDiskStats {
	name: string;
	readSpeed: number;
	writeSpeed: number;
	totalBytes: number;
	freeBytes: number;
	usagePercent: number;
}

export interface HardwareNetStats {
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
}

export interface HardwareCheckStats {
	bucketDate: string;
	avgCpuUsage: number;
	avgMemoryUsage: number;
	avgTemperature: number[];
	disks: HardwareDiskStats[];
	net: HardwareNetStats[];
}

export interface HardwareStats {
	aggregateData: {
		totalChecks: number;
	};
	upChecks: {
		totalChecks: number;
	};
	checks: HardwareCheckStats[];
}

export interface HardwareDetailsResponse {
	monitor: Monitor;
	stats: HardwareStats;
	monitorStats: MonitorStats | null;
}

export interface DockerStatsBucket {
	_id: string;
	avgResponseTime: number | null;
	upCount: number;
	totalCount: number;
	avgRunning: number | null;
	avgTotal: number | null;
	avgUnhealthy: number | null;
}

export interface DockerStats {
	aggregateData: {
		totalChecks: number;
	};
	upChecks: {
		totalChecks: number;
	};
	aggregate: DockerStatsBucket[];
	latest: {
		containers: DockerContainerInfo[];
		summary?: DockerContainerSummary;
		checkedAt: string;
	} | null;
}

export interface DockerDetailsResponse {
	monitor: Monitor;
	stats: DockerStats;
	monitorStats: MonitorStats | null;
}
export interface DockerContainerStatsBucket {
	_id: string;
	avgCpuPct: number | null;
	avgMemoryUsedBytes: number | null;
	avgMemoryPct: number | null;
	minRestartCount: number | null;
	maxRestartCount: number | null;
}

export interface DockerContainerStats {
	aggregate: DockerContainerStatsBucket[];
	restartsInRange: number;
	latest: {
		container: DockerContainerInfo;
		checkedAt: string;
	} | null;
}
export interface DockerContainerResponse {
	monitor: Monitor;
	stats: DockerContainerStats;
}

export interface Game {
	name: string;
	options?: {
		port?: number;
	};
}

export type GamesMap = Record<string, Game>;
