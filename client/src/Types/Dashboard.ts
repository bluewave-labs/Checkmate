export const dashboardCardKeys = [
	"monitorStatus",
	"currentlyDown",
	"lowestUptime",
	"monitorsByType",
] as const;
export type DashboardCardKey = (typeof dashboardCardKeys)[number];
