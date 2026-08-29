import { useMemo } from "react";

import { BreakdownCard, type BreakdownBucket } from "./BreakdownCard";
import { useMonitors } from "../../useDashboardData";

export const MonitorsByGroupCard = () => {
	const { data, isLoading, isValidating, error } = useMonitors();

	// `group` is a plain string | null on the monitor — there is no groups
	// endpoint, so the set is whatever monitors actually declare.
	const buckets = useMemo<BreakdownBucket[]>(() => {
		const byGroup = new Map<string, BreakdownBucket>();
		for (const monitor of data?.monitors ?? []) {
			if (!monitor.group) {
				continue;
			}
			const bucket = byGroup.get(monitor.group) ?? {
				key: monitor.group,
				label: monitor.group,
				total: 0,
				down: 0,
			};
			bucket.total += 1;
			if (monitor.status === "down" || monitor.status === "breached") {
				bucket.down += 1;
			}
			byGroup.set(monitor.group, bucket);
		}
		return [...byGroup.values()].sort((a, b) => b.total - a.total);
	}, [data]);

	return (
		<BreakdownCard
			titleKey="pages.dashboard.cards.monitorsByGroup.title"
			emptyKey="pages.dashboard.cards.monitorsByGroup.empty"
			to="/uptime"
			buckets={buckets}
			isLoading={isLoading && !data}
			isStale={isValidating && Boolean(data)}
			error={error}
		/>
	);
};
