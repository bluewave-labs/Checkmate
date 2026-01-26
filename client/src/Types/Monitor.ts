import type { Check, GroupedCheck } from "@/Types/Check";
export type MonitorStatus = boolean | undefined;

export const MonitorTypes = [
	"http",
	"ping",
	"pagespeed",
	"hardware",
	"docker",
	"port",
	"game",
	"unknown",
] as const;
export type MonitorType = (typeof MonitorTypes)[number];

export interface Monitor {
	checks: Check[];
	createdAt: string;
	createdBy: string;
	interval: number;
	isActive: boolean;
	latestChecks: Check[];
	n: number;
	name: string;
	status: MonitorStatus;
	type: string;
	updatedAt: string;
	updatedBy: string;
	url: string;
	id: string;
}

export interface MonitorWithChecks extends Monitor {
	checks: Check[];
	uptimePercentage?: number;
}

export interface MonitorsSummary {
	totalMonitors: number;
	upMonitors: number;
	downMonitors: number;
	pausedMonitors: number;
}

export interface MonitorsWithChecksResponse {
	count: number;
	monitors: MonitorWithChecks[];
	summary: MonitorsSummary;
}

export interface MonitorStats {
	id: string;
	monitorId: string;
	avgResponseTime: number;
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
	monitor: MonitorWithChecks;
	monitorStats: MonitorStats | null;
}
