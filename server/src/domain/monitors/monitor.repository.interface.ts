import type {
	MonitorType,
	Monitor,
	MonitorStatus,
	MonitorsSummary,
	MonitorTypeCount,
	CheckSnapshot,
	MonitorScheduleFields,
	DashboardByTeamIdResult,
} from "@/domain/monitors/monitor.type.js";

export interface TeamQueryConfig {
	limit?: number;
	type?: MonitorType | MonitorType[];
	tags?: string | string[];
	page?: number;
	rowsPerPage?: number;
	filter?: string;
	field?: string;
	order?: "asc" | "desc";
}

export interface SummaryConfig {
	type?: MonitorType | MonitorType[];
	tags?: string | string[];
}

export type RecentChecksMode = "all" | "latestHardware" | "none";

export interface IMonitorsRepository {
	// create
	create(monitor: Monitor, teamId: string, userId: string): Promise<Monitor | null>;
	createMonitors(monitors: Monitor[]): Promise<Monitor[]>;
	// single fetch
	findById(monitorId: string, teamId: string): Promise<Monitor>;
	// for workers, don't need all details
	findByIdLean(monitorId: string): Promise<Monitor | null>;
	// Lookup by slug for heartbeat pings, scoped to the team that owns the ping key
	findHeartbeatBySlug(teamId: string, slug: string): Promise<Monitor | null>;
	// Which of these slugs heartbeat monitors in the team already use
	findExistingHeartbeatSlugs(teamId: string, slugs: string[]): Promise<string[]>;

	// collection fetch
	findAllForScheduling(): Promise<MonitorScheduleFields[]>;
	findByTeamId(teamId: string, config: TeamQueryConfig, options?: { includeRecentChecks?: boolean }): Promise<Monitor[]>;
	findByTeamIdWithStats(teamId: string, config: TeamQueryConfig): Promise<Monitor[]>;
	findByIds(monitorIds: string[], options?: { recentChecks?: RecentChecksMode }): Promise<Monitor[]>;

	// update
	updateById(monitorId: string, teamId: string, updates: Partial<Monitor>, options?: { unsetProxyId?: boolean }): Promise<Monitor>;
	updateByIds(monitorIds: string[], teamId: string, updates: Partial<Monitor>, excludeStatuses?: MonitorStatus[]): Promise<number>;
	updateStatusWindowAndChecks(
		monitorId: string,
		teamId: string,
		status: boolean,
		checkSnapshot: CheckSnapshot,
		windowSize: number,
		maxRecentChecks: number,
		statusPatch?: Partial<Monitor>
	): Promise<Monitor>;

	togglePauseById(monitorId: string, teamId: string): Promise<Monitor>;
	bulkTogglePause(monitorIds: string[], teamId: string, pause: boolean): Promise<Monitor[]>;
	// delete
	deleteById(monitorId: string, teamId: string): Promise<Monitor>;
	deleteByTeamId(teamId: string): Promise<{ monitors: Monitor[]; deletedCount: number }>;

	// counts
	findMonitorCountByTeamIdAndType(teamId: string, config: TeamQueryConfig): Promise<number>;
	findMonitorCountByProxyId(proxyId: string): Promise<number>;
	findMonitorTypeCount(): Promise<MonitorTypeCount>;

	// Docker TLS
	findDockerTlsKeyById(monitorId: string): Promise<string | null>;
	findAllDockerTlsKeys(): Promise<{ id: string; dockerTlsKey: string }[]>;
	updateDockerTlsKey(monitorId: string, dockerTlsKey: string): Promise<void>; // Needed for worker to rotate keys, no teamId/userId

	// other
	findMonitorsSummaryByTeamId(teamId: string, config?: SummaryConfig): Promise<MonitorsSummary>;
	findDashboardByTeamId(teamId: string, config?: Pick<TeamQueryConfig, "limit" | "order">): Promise<DashboardByTeamIdResult>;
	removeNotificationFromMonitors(notificationId: string): Promise<void>;
	removeTagFromMonitors(tagId: string): Promise<void>;
	updateNotifications(teamId: string, monitorIds: string[], notificationIds: string[], action: "add" | "remove" | "set"): Promise<number>;
	deleteByTeamIdsNotIn(teamIds: string[]): Promise<number>;
	findAllMonitorIds(): Promise<string[]>;
}
