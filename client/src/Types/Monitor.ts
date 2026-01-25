import type { Check } from "@/Types/Check";
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

export interface MonitorGroupedCheck {
	time: number;
	responseTime: number;
	originalResponseTime: number;
	totalChecks: number;
}

export interface MonitorStats {
	totalChecks: number;
	upChecks: number;
	downChecks: number;
	uptimePercentage: number;
	averageResponseTime: number;
}

export interface MonitorData {
	monitor: Monitor;
	groupedChecks: MonitorGroupedCheck[];
}

export interface MonitorDetailsResponse {
	monitorData: MonitorData;
	monitorStats: MonitorStats;
}
