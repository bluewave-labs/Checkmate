import type { CheckSnapshot } from "@/domain/checks/check.type.js";
export type { CheckSnapshot } from "@/domain/checks/check.type.js";
import type { GeoContinent, GroupedGeoCheck } from "@/domain/geo-checks/geo-check.type.js";
export type { GeoContinent } from "@/domain/geo-checks/geo-check.type.js";
import type { ScriptExecutionTarget } from "@/types/script.js";
import http from "node:http";

export const HttpStatusCodes = [
	...Object.keys(http.STATUS_CODES).map(Number),
	419, // Page Expired (Laravel)
	420, // Enhance Your Calm (Twitter)
	440, // Login Time-out (IIS)
	449, // Retry With (IIS)
	460, // Client Closed Connection (AWS ELB)
	463, // X-Forwarded-For Too Large (AWS ELB)
	497, // HTTP Request Sent to HTTPS Port (NGINX)
	499, // Client Closed Request (NGINX)
	509, // Bandwidth Limit Exceeded (Apache)
	520, // Web Server Returned an Unknown Error (Cloudflare)
	521, // Web Server Is Down (Cloudflare)
	522, // Connection Timed Out (Cloudflare)
	523, // Origin Is Unreachable (Cloudflare)
	524, // A Timeout Occurred (Cloudflare)
	525, // SSL Handshake Failed (Cloudflare)
	526, // Invalid SSL Certificate (Cloudflare)
	527, // Railgun Error (Cloudflare)
	529, // Site is overloaded
	530, // Site is frozen (Cloudflare)
	561, // Unauthorized (AWS ELB)
];
export const HttpStatusCodeSet = new Set(HttpStatusCodes);
export type HttpStatusCode = number;

// MonitorTypes is alphabetical (with "unknown" last as a sentinel).
export const MonitorTypes = [
	"dns",
	"docker",
	"game",
	"grpc",
	"hardware",
	"http",
	"pagespeed",
	"ping",
	"port",
	"script",
	"websocket",
	"unknown",
] as const;
export type MonitorType = (typeof MonitorTypes)[number];

export const PageSpeedStrategies = ["desktop", "mobile"] as const;
export type PageSpeedStrategy = (typeof PageSpeedStrategies)[number];
export const DefaultPageSpeedStrategy: PageSpeedStrategy = "desktop";

export const GeoCheckSupportedTypes: readonly MonitorType[] = ["http", "ping"] as const;
export const supportsGeoCheck = (type: MonitorType): boolean => GeoCheckSupportedTypes.includes(type);

export const UptimeDetailsSupportedTypes = [
	"http",
	"ping",
	"docker",
	"port",
	"game",
	"grpc",
	"websocket",
	"dns",
] as const satisfies readonly MonitorType[];
export type UptimeDetailsSupportedType = (typeof UptimeDetailsSupportedTypes)[number];
export const supportsUptimeDetails = (type: MonitorType): type is UptimeDetailsSupportedType => UptimeDetailsSupportedTypes.some((t) => t === type);

export const MonitorStatuses = ["up", "down", "paused", "initializing", "maintenance", "breached"] as const;
export type MonitorStatus = (typeof MonitorStatuses)[number];

export const MonitorMatchMethods = ["equal", "include", "regex"] as const;
export type MonitorMatchMethod = (typeof MonitorMatchMethods)[number] | "";

export const DnsRecordTypes = ["A", "AAAA", "CNAME", "MX", "TXT", "NS"] as const;
export type DnsRecordType = (typeof DnsRecordTypes)[number];

export const HttpMethods = ["GET", "HEAD"] as const;
export type HttpMethod = (typeof HttpMethods)[number];

export const MAX_RECENT_CHECKS = 50;

export interface Monitor {
	id: string;
	userId: string;
	teamId: string;
	name: string;
	description?: string;
	method: HttpMethod;
	status: MonitorStatus;
	statusWindow: boolean[];
	statusWindowSize: number;
	statusWindowThreshold: number;
	type: MonitorType;
	ignoreTlsErrors: boolean;
	useAdvancedMatching: boolean;
	jsonPath?: string;
	expectedValue?: string;
	matchMethod?: MonitorMatchMethod;
	url: string;
	port?: number;
	isActive: boolean;
	interval: number;
	uptimePercentage?: number;
	notifications: string[];
	tags: string[];
	customUpCodes: HttpStatusCode[];
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
	// Script monitor fields
	scriptId?: string;
	scriptExecutionTarget?: ScriptExecutionTarget;
	probeId?: string;
	captureAgentId?: string;
	deviceId?: string;
	warningCountsAsDown?: boolean;
	scriptExitCodeSuccess?: number;
	scriptOutputMatchRegex?: string;
	scriptMaxExecutionTimeMs?: number;
	scriptParameterOverrides?: Record<string, string>;
	recentChecks: CheckSnapshot[];
	createdAt: string;
	updatedAt: string;
	lastEvaluatedAt: number; // epoch ms
}

export interface MonitorsSummary {
	totalMonitors: number;
	upMonitors: number;
	downMonitors: number;
	pausedMonitors: number;
	initializingMonitors: number;
	maintenanceMonitors: number;
	breachedMonitors: number;
}

export interface MonitorsWithChecksByTeamIdResult {
	summary: MonitorsSummary | null;
	count: number;
	monitors: Monitor[];
}

export interface GroupedGeoCheckResult {
	groupedGeoChecks: GroupedGeoCheck[];
}

export interface UptimeDetailsResult {
	monitorData: {
		monitor: Monitor;
		groupedChecks: import("../checks/check.type.js").GroupedCheck[];
		groupedUpChecks: import("../checks/check.type.js").GroupedCheck[];
		groupedDownChecks: import("../checks/check.type.js").GroupedCheck[];
		groupedAvgResponseTime: number;
		groupedUptimePercentage: number;
	};
	monitorStats: import("../monitor-stats/monitor-stats.type.js").MonitorStats | null;
}

export interface ScriptMonitorSummary {
	totalChecks: number;
	upChecks: number;
	downChecks: number;
	uptimePercentage: number;
}

export interface ScriptMonitorDetailsResult {
	monitor: Monitor;
	checks: import("@/domain/checks/check.type.js").Check[];
	summary: ScriptMonitorSummary;
	monitorStats: import("@/domain/monitor-stats/monitor-stats.type.js").MonitorStats | null;
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

export interface HardwareDetailsResult {
	monitor: Monitor;
	stats: HardwareStats;
	monitorStats: import("../monitor-stats/monitor-stats.type.js").MonitorStats | null;
}

export interface PageSpeedDetailsResult {
	monitorData: {
		monitor: Monitor;
		groupedChecks: import("../checks/check.type.js").PageSpeedGroupedCheck[];
	};
	monitorStats: import("../monitor-stats/monitor-stats.type.js").MonitorStats | null;
}

export interface Game {
	name: string;
	release_year?: number;
	options?: {
		port?: number;
		port_query?: number;
		protocol?: string;
	};
	extra?: {
		old_id?: string;
	};
}

export type GamesMap = Record<string, Game>;
