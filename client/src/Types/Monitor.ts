import type { GroupedCheck, CheckSnapshot } from "@/Types/Check";
import type { PageSpeedGroupedCheck } from "@/Types/Check";
import type { GeoContinent } from "@/Types/GeoCheck";
export type { GeoContinent } from "@/Types/GeoCheck";

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
	"unknown",
] as const;
export type MonitorType = (typeof MonitorTypes)[number];

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

export type MonitorMatchMethod = "equal" | "include" | "regex" | "";

export interface MonitorNotificationRule {
	channelId: string;
	delayMinutes: number;
}

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
	notifications: MonitorNotificationRule[];
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
	recentChecks: CheckSnapshot[];
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
	groupedChecks: GroupedCheck[];
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

export interface Game {
	name: string;
	options?: {
		port?: number;
	};
}

export type GamesMap = Record<string, Game>;
