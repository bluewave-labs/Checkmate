import type { CheckSnapshot } from "@/types/check.js";
export type { CheckSnapshot } from "@/types/check.js";

export const MonitorTypes = ["http", "ping", "pagespeed", "hardware", "docker", "port", "game", "unknown"] as const;
export type MonitorType = (typeof MonitorTypes)[number];

export const MonitorStatuses = ["up", "down", "paused", "initializing", "maintenance"] as const;
export type MonitorStatus = (typeof MonitorStatuses)[number];

export interface MonitorThresholds {
	usage_cpu?: number;
	usage_memory?: number;
	usage_disk?: number;
	usage_temperature?: number;
}

export type MonitorMatchMethod = "equal" | "include" | "regex" | "";

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
	thresholds?: MonitorThresholds;
	alertThreshold: number;
	cpuAlertThreshold: number;
	memoryAlertThreshold: number;
	diskAlertThreshold: number;
	tempAlertThreshold: number;
	selectedDisks: string[];
	gameId?: string;
	group: string | null;
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
}

export interface MonitorsWithChecksByTeamIdResult {
	summary: MonitorsSummary | null;
	count: number;
	monitors: Monitor[];
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
	monitor: Monitor & {
		checks: import("./check.js").Check[];
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
