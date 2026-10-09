import type {
	Monitor,
	MonitorStats,
	MonitorsSummary,
	MonitorTypeCount,
} from "@/Types/Monitor";

export const dashboardCardKeys = [
	"monitorStatus",
	"currentlyDown",
	"uptime",
	"monitorsByType",
] as const;
export type DashboardCardKey = (typeof dashboardCardKeys)[number];

export const dashboardSortOrders = ["ascending", "descending"] as const;
export type DashboardSortOrder = (typeof dashboardSortOrders)[number];

export interface DashboardMonitor
	extends
		Pick<Monitor, "id" | "name" | "url" | "type" | "status">,
		Pick<MonitorStats, "uptimePercentage">,
		Partial<Pick<MonitorStats, "lastCheckTimestamp">> {}

export interface DashboardResponse {
	summary: MonitorsSummary;
	byType: MonitorTypeCount[];
	down: DashboardMonitor[];
	uptime: DashboardMonitor[];
}
