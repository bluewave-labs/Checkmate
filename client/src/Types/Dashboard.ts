export const dashboardCardKeys = [
	"monitorStatus",
	"currentlyDown",
	"uptime",
	"monitorsByType",
] as const;
export type DashboardCardKey = (typeof dashboardCardKeys)[number];

export const dashboardSortOrders = ["ascending", "descending"] as const;
export type DashboardSortOrder = (typeof dashboardSortOrders)[number];
