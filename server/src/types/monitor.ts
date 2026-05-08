import type { CheckSnapshot } from "@/types/check.js";
export type { CheckSnapshot } from "@/types/check.js";
import type { GeoContinent, GroupedGeoCheck } from "@/types/geoCheck.js";
export type { GeoContinent } from "@/types/geoCheck.js";

export const MonitorTypes = ["http", "ping", "pagespeed", "hardware", "docker", "port", "game", "grpc", "websocket", "dns", "unknown"] as const;
export type MonitorType = (typeof MonitorTypes)[number];

export const GeoCheckSupportedTypes: readonly MonitorType[] = ["http", "ping"] as const;
export const supportsGeoCheck = (type: MonitorType): boolean => GeoCheckSupportedTypes.includes(type);

export const MonitorStatuses = ["up", "down", "paused", "initializing", "maintenance", "breached"] as const;
export type MonitorStatus = (typeof MonitorStatuses)[number];

export const MonitorMatchMethods = ["equal", "include", "regex"] as const;
export type MonitorMatchMethod = (typeof MonitorMatchMethods)[number] | "";

export const DnsRecordTypes = ["A", "AAAA", "CNAME", "MX", "TXT", "NS"] as const;
export type DnsRecordType = (typeof DnsRecordTypes)[number];

export const MAX_RECENT_CHECKS = 50;

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
	group: string | null;
	geoCheckEnabled?: boolean;
	geoCheckLocations?: GeoContinent[];
	geoCheckInterval?: number;
	dnsServer?: string;
	dnsRecordType?: DnsRecordType;
	recentChecks: CheckSnapshot[];
	createdAt: string;
	updatedAt: string;
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
		groupedChecks: import("./check.js").GroupedCheck[];
		groupedUpChecks: import("./check.js").GroupedCheck[];
		groupedDownChecks: import("./check.js").GroupedCheck[];
		groupedAvgResponseTime: number;
		groupedUptimePercentage: number;
	};
	monitorStats: import("./monitorStats.js").MonitorStats | null;
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
	monitorStats: import("./monitorStats.js").MonitorStats | null;
}

export interface PageSpeedDetailsResult {
	monitorData: {
		monitor: Monitor;
		groupedChecks: import("./check.js").PageSpeedGroupedCheck[];
	};
	monitorStats: import("./monitorStats.js").MonitorStats | null;
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
