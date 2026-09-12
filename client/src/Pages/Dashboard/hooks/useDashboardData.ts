import { useGet } from "@/Hooks/UseApi";
import type { DashboardSummaryResult } from "@/Pages/Dashboard/types";
import type { MonitorsSummary } from "@/Types/Monitor";

const EMPTY_SUMMARY: MonitorsSummary = {
	totalMonitors: 0,
	upMonitors: 0,
	downMonitors: 0,
	pausedMonitors: 0,
	initializingMonitors: 0,
	maintenanceMonitors: 0,
	breachedMonitors: 0,
};

export const useDashboardData = () => {
	const { data, isLoading, error } = useGet<DashboardSummaryResult>(
		"/dashboard/summary",
		undefined,
		{
			refreshInterval: 30000,
		}
	);

	return {
		isLoading,
		error,
		summary: data?.summary ?? EMPTY_SUMMARY,
		monitorsByType: data?.monitorsByType ?? [],
	};
};
