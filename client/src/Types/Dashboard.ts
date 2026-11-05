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
	"diagnostic",
	"queue",
] as const;
export type DashboardCardKey = (typeof dashboardCardKeys)[number];

export const adminDashboardCardKeys: readonly DashboardCardKey[] = [
	"diagnostic",
	"queue",
];

export interface DashboardMonitor
	extends
		Pick<Monitor, "id" | "name" | "url" | "type" | "status" | "uptimePercentage">,
		Partial<Pick<MonitorStats, "lastCheckTimestamp">> {}

export interface DashboardResponse {
	summary: MonitorsSummary;
	byType: MonitorTypeCount[];
	down: DashboardMonitor[];
	uptime: DashboardMonitor[];
}
