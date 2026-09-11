import type { MonitorsSummary } from "@/domain/monitors/monitor.type.js";

export interface DashboardMonitorRow {
	id: string;
	name: string;
	status: string;
	type: string;
	group: string | null;
	uptimePercentage: number;
	avgResponseTime: number;
}

export interface DashboardTypeCount {
	type: string;
	count: number;
}

export interface DashboardGroupCount {
	group: string;
	count: number;
}

export interface DashboardSummaryResult {
	summary: MonitorsSummary;
	monitors: DashboardMonitorRow[];
	slowestMonitors: DashboardMonitorRow[];
	lowestUptimeMonitors: DashboardMonitorRow[];
	downMonitors: DashboardMonitorRow[];
	monitorsByType: DashboardTypeCount[];
	monitorsByGroup: DashboardGroupCount[];
}
