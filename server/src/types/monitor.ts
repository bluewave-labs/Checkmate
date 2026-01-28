import type { Check } from "@/types/check.js";
import type { CheckSnapshot } from "@/types/check.js";
export type { CheckSnapshot } from "@/types/check.js";

export const MonitorTypes = ["http", "ping", "pagespeed", "hardware", "docker", "port", "game", "unknown"] as const;
export type MonitorType = (typeof MonitorTypes)[number];

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
	status?: boolean;
	statusWindow: boolean[];
	statusWindowSize: number;
	statusWindowThreshold: number;
	type: MonitorType;
	ignoreTlsErrors: boolean;
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

export interface HardwareDetailsResult {
	monitor: Monitor;
	stats: {
		aggregateData: {
			totalChecks: number;
		};
		upChecks: {
			totalChecks: number;
		};
		checks: Array<{
			_id: string;
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
	};
	monitorStats: import("./monitorStats.js").MonitorStats | null;
}

export interface PageSpeedDetailsResult {
	monitor: Monitor & {
		checks: import("./check.js").Check[];
	};
	monitorStats: import("./monitorStats.js").MonitorStats | null;
}
