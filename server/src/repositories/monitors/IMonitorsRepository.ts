import { type MonitorType, type Monitor, type MonitorsSummary, CheckSnapshot } from "@/types/index.js";

export interface TeamQueryConfig {
	limit?: number;
	type?: MonitorType | MonitorType[];
	page?: number;
	rowsPerPage?: number;
	filter?: string;
	field?: string;
	order?: "asc" | "desc";
}

export interface SummaryConfig {
	type?: MonitorType | MonitorType[];
}

export interface IMonitorsRepository {
	// create
	create(monitor: Monitor, teamId: string, userId: string): Promise<Monitor | null>;
	createMonitors(monitors: Monitor[]): Promise<Monitor[]>;
	// single fetch
	findById(monitorId: string, teamId: string): Promise<Monitor>;

	// collection fetch
	findAll(): Promise<Monitor[] | null>;
	findByTeamId(teamId: string, config: TeamQueryConfig): Promise<Monitor[] | null>;
	findByIds(monitorIds: string[]): Promise<Monitor[]>;
	findByIdsWithChecks(monitorIds: string[], checksCount?: number): Promise<Monitor[]>;

	// update
	updateById(monitorId: string, teamId: string, updates: Partial<Monitor>): Promise<Monitor>;
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

	// other
	findMonitorsSummaryByTeamId(teamId: string, config?: SummaryConfig): Promise<MonitorsSummary>;
	findGroupsByTeamId(teamId: string): Promise<string[]>;
	removeNotificationFromMonitors(notificationId: string): Promise<void>;
	updateNotifications(teamId: string, monitorIds: string[], notificationIds: string[], action: "add" | "remove" | "set"): Promise<number>;
	addNotificationToAllMonitors(teamId: string, notificationId: string): Promise<number>;
	deleteByTeamIdsNotIn(teamIds: string[]): Promise<number>;
	findAllMonitorIds(): Promise<string[]>;
}
