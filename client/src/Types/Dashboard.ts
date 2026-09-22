export const dashboardCardKeys = ["monitorStatus", "monitorsByType"] as const;
export type DashboardCardKey = (typeof dashboardCardKeys)[number];
