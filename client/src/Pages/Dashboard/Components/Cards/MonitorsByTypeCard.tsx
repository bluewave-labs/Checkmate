import { useMemo } from "react";

import { getMonitorPath } from "@/Utils/MonitorUtils";
import { BreakdownCard, type BreakdownBucket } from "./BreakdownCard";
import { useMonitors } from "../../useDashboardData";

import type { MonitorType } from "@/Types/Monitor";

export const MonitorsByTypeCard = () => {
	const { data, isLoading, isValidating, error } = useMonitors();

	const buckets = useMemo<BreakdownBucket[]>(() => {
		const byType = new Map<MonitorType, BreakdownBucket>();
		for (const monitor of data?.monitors ?? []) {
			const bucket = byType.get(monitor.type) ?? {
				key: monitor.type,
				label: monitor.type,
				total: 0,
				down: 0,
				to: `/${getMonitorPath(monitor.type)}`,
			};
			bucket.total += 1;
			if (monitor.status === "down" || monitor.status === "breached") {
				bucket.down += 1;
			}
			byType.set(monitor.type, bucket);
		}
		return [...byType.values()].sort((a, b) => b.total - a.total);
	}, [data]);

	return (
		<BreakdownCard
			titleKey="pages.dashboard.cards.monitorsByType.title"
			emptyKey="pages.dashboard.cards.monitorsByType.empty"
			to="/uptime"
			buckets={buckets}
			isLoading={isLoading && !data}
			isStale={isValidating && Boolean(data)}
			error={error}
		/>
	);
};
