import type { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";
import type { Monitor } from "@/domain/monitors/monitor.type.js";
import type { DashboardMonitorRow, DashboardSummaryResult, DashboardTypeCount, DashboardGroupCount } from "@/domain/dashboard/dashboard.type.js";

const TOP_N = 5;

const avgResponseTime = (monitor: Monitor): number => {
	const times = (monitor.recentChecks ?? []).map((c) => c.responseTime).filter((t): t is number => t != null && t > 0);
	return times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
};

const toRow = (monitor: Monitor): DashboardMonitorRow => ({
	id: monitor.id,
	name: monitor.name,
	status: monitor.status,
	type: monitor.type,
	group: monitor.group ?? null,
	uptimePercentage: (monitor.uptimePercentage ?? 1) * 100,
	avgResponseTime: avgResponseTime(monitor),
});

export interface IDashboardService {
	getSummary(teamId: string): Promise<DashboardSummaryResult>;
}

export class DashboardService implements IDashboardService {
	private monitorsRepository: IMonitorsRepository;

	constructor(monitorsRepository: IMonitorsRepository) {
		this.monitorsRepository = monitorsRepository;
	}

	getSummary = async (teamId: string): Promise<DashboardSummaryResult> => {
		const [summary, monitors] = await Promise.all([
			this.monitorsRepository.findMonitorsSummaryByTeamId(teamId),
			this.monitorsRepository.findByTeamIdWithStats(teamId, { limit: 200 }),
		]);

		const rows = monitors.map(toRow);

		const slowestMonitors = [...rows]
			.filter((r) => r.avgResponseTime > 0)
			.sort((a, b) => b.avgResponseTime - a.avgResponseTime)
			.slice(0, TOP_N);

		const lowestUptimeMonitors = [...rows].sort((a, b) => a.uptimePercentage - b.uptimePercentage).slice(0, TOP_N);

		const downMonitors = rows.filter((r) => r.status === "down");

		const typeMap = new Map<string, number>();
		rows.forEach((r) => typeMap.set(r.type, (typeMap.get(r.type) ?? 0) + 1));
		const monitorsByType: DashboardTypeCount[] = [...typeMap.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);

		const groupMap = new Map<string, number>();
		rows.forEach((r) => {
			if (r.group) groupMap.set(r.group, (groupMap.get(r.group) ?? 0) + 1);
		});
		const monitorsByGroup: DashboardGroupCount[] = [...groupMap.entries()]
			.map(([group, count]) => ({ group, count }))
			.sort((a, b) => b.count - a.count);

		return {
			summary,
			monitors: rows,
			slowestMonitors,
			lowestUptimeMonitors,
			downMonitors,
			monitorsByType,
			monitorsByGroup,
		};
	};
}
