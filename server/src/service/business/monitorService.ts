import { NormalizeData, NormalizeDataUptimeDetails } from "@/utils/dataUtils.js";
import { type Monitor } from "@/types/index.js";
import type {
	MonitorType,
	MonitorsWithChecksByTeamIdResult,
	UptimeDetailsResult,
	HardwareDetailsResult,
	PageSpeedDetailsResult,
	GamesMap,
	GroupedGeoCheckResult,
} from "@/types/monitor.js";
import { supportsGeoCheck } from "@/types/monitor.js";
import type { GeoContinent } from "@/types/geoCheck.js";
import type {
	IChecksRepository,
	IGeoChecksRepository,
	IIncidentsRepository,
	IMonitorsRepository,
	IMonitorStatsRepository,
	IStatusPagesRepository,
} from "@/repositories/index.js";
import demoMonitorsData from "@/utils/demoMonitors.json" with { type: "json" };
import { AppError } from "@/utils/AppError.js";
import type { ImportedMonitor } from "@/validation/monitorValidation.js";
import { ISuperSimpleQueue } from "../infrastructure/SuperSimpleQueue/SuperSimpleQueue.js";
import { ILogger } from "@/utils/logger.js";

const SERVICE_NAME = "MonitorService";
type DateRangeKey = "recent" | "day" | "week" | "month" | "all";

export interface IMonitorService {
	readonly serviceName: string;

	// create
	createMonitor(teamId: string, userId: string, body: Partial<Monitor>): Promise<void>;
	createMonitors(monitors: Array<Monitor>): Promise<Monitor[] | null>;
	addDemoMonitors(args: { userId: string; teamId: string }): Promise<Monitor[]>;

	// read
	getUptimeDetailsById(args: { teamId: string; monitorId: string; dateRange: string }): Promise<UptimeDetailsResult>;
	getHardwareDetailsById(args: { teamId: string; monitorId: string; dateRange: string }): Promise<HardwareDetailsResult>;
	getPageSpeedDetailsById(args: { teamId: string; monitorId: string; dateRange: string }): Promise<PageSpeedDetailsResult>;
	getGeoChecksByMonitorId(args: {
		teamId: string;
		monitorId: string;
		dateRange: string;
		continents?: GeoContinent[];
	}): Promise<GroupedGeoCheckResult>;
	getMonitorById(args: { teamId: string; monitorId: string }): Promise<Monitor>;
	getMonitorsByTeamId(args: {
		teamId: string;
		limit?: number;
		type?: MonitorType | MonitorType[];
		page?: number;
		rowsPerPage?: number;
		filter?: string;
		field?: string;
		order?: "asc" | "desc";
	}): Promise<Monitor[] | null>;
	getMonitorsWithChecksByTeamId(args: {
		teamId: string;
		limit?: number;
		type?: MonitorType | MonitorType[];
		page?: number;
		rowsPerPage?: number;
		filter?: string;
		field?: string;
		order?: "asc" | "desc";
	}): Promise<MonitorsWithChecksByTeamIdResult>;
	getAllGames(): GamesMap;
	getGroupsByTeamId(args: { teamId: string }): Promise<string[]>;

	// update
	editMonitor(args: { teamId: string; monitorId: string; body: Partial<Monitor> }): Promise<Monitor>;
	pauseMonitor(args: { teamId: string; monitorId: string }): Promise<Monitor>;
	bulkPauseMonitors(args: { teamId: string; monitorIds: string[]; pause: boolean }): Promise<{ monitors: Monitor[]; failedCount: number }>;

	// delete
	deleteMonitor(args: { teamId: string; monitorId: string }): Promise<Monitor>;
	deleteAllMonitors(args: { teamId: string }): Promise<number>;

	// notifications
	updateNotifications(args: { teamId: string; monitorIds: string[]; notificationIds: string[]; action: "add" | "remove" | "set" }): Promise<number>;

	// other
	exportMonitorsToJSON(args: { teamId: string }): Promise<Monitor[]>;
	importMonitorsFromJSON(args: { teamId: string; userId: string; monitors: ImportedMonitor[] }): Promise<{ imported: number; errors: string[] }>;
}

export class MonitorService implements IMonitorService {
	static SERVICE_NAME = SERVICE_NAME;

	private jobQueue: ISuperSimpleQueue;
	private logger: ILogger;
	private games: GamesMap;
	private monitorsRepository: IMonitorsRepository;
	private checksRepository: IChecksRepository;
	private geoChecksRepository: IGeoChecksRepository;
	private monitorStatsRepository: IMonitorStatsRepository;
	private statusPagesRepository: IStatusPagesRepository;
	private incidentsRepository: IIncidentsRepository;

	constructor({
		jobQueue,
		logger,
		games,
		monitorsRepository,
		checksRepository,
		geoChecksRepository,
		monitorStatsRepository,
		statusPagesRepository,
		incidentsRepository,
	}: {
		jobQueue: ISuperSimpleQueue;
		logger: ILogger;
		games: GamesMap;
		monitorsRepository: IMonitorsRepository;
		checksRepository: IChecksRepository;
		geoChecksRepository: IGeoChecksRepository;
		monitorStatsRepository: IMonitorStatsRepository;
		statusPagesRepository: IStatusPagesRepository;
		incidentsRepository: IIncidentsRepository;
	}) {
		this.jobQueue = jobQueue;
		this.logger = logger;
		this.games = games;
		this.monitorsRepository = monitorsRepository;
		this.checksRepository = checksRepository;
		this.geoChecksRepository = geoChecksRepository;
		this.monitorStatsRepository = monitorStatsRepository;
		this.statusPagesRepository = statusPagesRepository;
		this.incidentsRepository = incidentsRepository;
	}

	get serviceName(): string {
		return MonitorService.SERVICE_NAME;
	}

	private getDateRange = (dateRange: DateRangeKey) => {
		const startDates = {
			recent: new Date(new Date().setHours(new Date().getHours() - 2)),
			day: new Date(new Date().setDate(new Date().getDate() - 1)),
			week: new Date(new Date().setDate(new Date().getDate() - 7)),
			month: new Date(new Date().setMonth(new Date().getMonth() - 1)),
			all: new Date(0),
		};
		return {
			start: startDates[dateRange],
			end: new Date(),
		};
	};

	private getDateFormat = (dateRange: DateRangeKey): string => {
		const formatLookup = {
			recent: "%Y-%m-%dT%H:%M:00Z",
			day: "%Y-%m-%dT%H:00:00Z",
			week: "%Y-%m-%dT00:00:00Z",
			month: "%Y-%m-%dT00:00:00Z",
			all: "%Y-%m-%dT00:00:00Z",
		};
		return formatLookup[dateRange];
	};

	createMonitor = async (teamId: string, userId: string, body: Monitor): Promise<void> => {
		const monitor = await this.monitorsRepository.create(body, teamId, userId);
		if (!monitor) {
			throw new AppError({ message: "Failed to create monitor", status: 500, service: SERVICE_NAME, method: "createMonitor" });
		}

		this.jobQueue.addJob(monitor.id, monitor);
	};

	createMonitors = async (monitors: Array<Monitor>): Promise<Monitor[] | null> => {
		const createdMonitors = await this.monitorsRepository.createMonitors(monitors);
		if (!createdMonitors || createdMonitors.length === 0) {
			throw new AppError({ message: "Failed to create monitors", status: 500, service: SERVICE_NAME, method: "createMonitors" });
		}

		await Promise.all(createdMonitors.map((monitor) => this.jobQueue.addJob(monitor.id, monitor)));
		return createdMonitors;
	};

	addDemoMonitors = async ({ userId, teamId }: { userId: string; teamId: string }): Promise<Monitor[]> => {
		const monitors = demoMonitorsData.map((monitor) => ({
			userId,
			teamId,
			name: monitor.name,
			description: monitor.name,
			type: "http" as const,
			url: monitor.url,
			interval: 60000,
		}));
		const demoMonitors = await this.monitorsRepository.createMonitors(monitors as unknown as Monitor[]);

		await Promise.all(demoMonitors.map((monitor) => this.jobQueue.addJob(monitor.id, monitor)));
		return demoMonitors;
	};

	getUptimeDetailsById = async ({
		teamId,
		monitorId,
		dateRange,
	}: {
		teamId: string;
		monitorId: string;
		dateRange: string;
	}): Promise<UptimeDetailsResult> => {
		const monitor = await this.monitorsRepository.findById(monitorId, teamId);
		if (!monitor) {
			throw new AppError({ message: `Monitor with ID ${monitorId} not found.`, status: 404 });
		}
		const rangeKey = dateRange as DateRangeKey;
		const { start, end } = this.getDateRange(rangeKey);
		const checksData = await this.checksRepository.findByDateRangeAndMonitorId(monitor.id, start, end, this.getDateFormat(rangeKey), {
			type: monitor.type,
		});
		const monitorStats = await this.monitorStatsRepository.findByMonitorId(monitor.id);

		if (
			checksData.monitorType !== "http" &&
			checksData.monitorType !== "ping" &&
			checksData.monitorType !== "docker" &&
			checksData.monitorType !== "port" &&
			checksData.monitorType !== "game" &&
			checksData.monitorType !== "grpc" &&
			checksData.monitorType !== "websocket" &&
			checksData.monitorType !== "dns"
		) {
			throw new AppError({ message: `${monitor.type} monitors are not supported for uptime details`, status: 400 });
		}

		return {
			monitorData: {
				monitor,
				groupedChecks: NormalizeDataUptimeDetails(checksData.groupedChecks, 10, 100),
				groupedUpChecks: NormalizeDataUptimeDetails(checksData.groupedUpChecks, 10, 100),
				groupedDownChecks: NormalizeDataUptimeDetails(checksData.groupedDownChecks, 10, 100),
				groupedAvgResponseTime: checksData.avgResponseTime,
				groupedUptimePercentage: checksData.uptimePercentage,
			},
			monitorStats,
		};
	};

	getHardwareDetailsById = async ({
		teamId,
		monitorId,
		dateRange,
	}: {
		teamId: string;
		monitorId: string;
		dateRange: string;
	}): Promise<HardwareDetailsResult> => {
		const monitor = await this.monitorsRepository.findById(monitorId, teamId);
		if (!monitor) {
			throw new AppError({ message: `Monitor with ID ${monitorId} not found.`, status: 404 });
		}
		if (monitor.type !== "hardware") {
			throw new AppError({ message: `${monitor.type} monitors are not supported for hardware details`, status: 400 });
		}

		const rangeKey = dateRange as DateRangeKey;
		const { start, end } = this.getDateRange(rangeKey);
		const checksData = await this.checksRepository.findByDateRangeAndMonitorId(monitor.id, start, end, this.getDateFormat(rangeKey), {
			type: monitor.type,
		});

		if (checksData.monitorType !== "hardware") {
			throw new AppError({ message: "Unable to load hardware stats for this monitor", status: 500 });
		}

		const stats = {
			aggregateData: checksData.aggregateData,
			upChecks: checksData.upChecks,
			checks: checksData.checks,
		};

		const monitorStats = await this.monitorStatsRepository.findByMonitorId(monitor.id);

		return {
			monitor,
			stats,
			monitorStats,
		};
	};

	getPageSpeedDetailsById = async ({
		teamId,
		monitorId,
		dateRange,
	}: {
		teamId: string;
		monitorId: string;
		dateRange: string;
	}): Promise<PageSpeedDetailsResult> => {
		const monitor = await this.monitorsRepository.findById(monitorId, teamId);
		if (!monitor) {
			throw new AppError({ message: `Monitor with ID ${monitorId} not found.`, status: 404 });
		}
		if (monitor.type !== "pagespeed") {
			throw new AppError({ message: `${monitor.type} monitors are not supported for pagespeed details`, status: 400 });
		}

		const rangeKey = dateRange as DateRangeKey;
		const { start, end } = this.getDateRange(rangeKey);
		const checksData = await this.checksRepository.findByDateRangeAndMonitorId(monitor.id, start, end, this.getDateFormat(rangeKey), {
			type: monitor.type,
		});

		if (checksData.monitorType !== "pagespeed") {
			throw new AppError({ message: "Unable to load pagespeed stats for this monitor", status: 500 });
		}

		const monitorStats = await this.monitorStatsRepository.findByMonitorId(monitor.id);

		return {
			monitorData: {
				monitor,
				groupedChecks: checksData.groupedChecks,
			},
			monitorStats,
		};
	};

	getGeoChecksByMonitorId = async ({
		teamId,
		monitorId,
		dateRange,
		continents,
	}: {
		teamId: string;
		monitorId: string;
		dateRange: string;
		continents?: GeoContinent[];
	}): Promise<GroupedGeoCheckResult> => {
		const monitor = await this.monitorsRepository.findById(monitorId, teamId);
		if (!monitor) {
			throw new AppError({ message: `Monitor with ID ${monitorId} not found.`, status: 404 });
		}

		if (!supportsGeoCheck(monitor.type) || !monitor.geoCheckEnabled) {
			return { groupedGeoChecks: [] };
		}

		const rangeKey = dateRange as DateRangeKey;
		const { start, end } = this.getDateRange(rangeKey);
		const groupedGeoChecks = await this.geoChecksRepository.findGroupedByMonitorIdAndDateRange(
			monitor.id,
			start,
			end,
			this.getDateFormat(rangeKey),
			continents
		);

		return { groupedGeoChecks };
	};

	getMonitorById = async ({ teamId, monitorId }: { teamId: string; monitorId: string }): Promise<Monitor> => {
		return await this.monitorsRepository.findById(monitorId, teamId);
	};

	getMonitorsByTeamId = async ({
		teamId,
		type,
		filter,
	}: {
		teamId: string;
		type?: MonitorType | MonitorType[];
		filter?: string;
	}): Promise<Monitor[] | null> => {
		return await this.monitorsRepository.findByTeamId(teamId, { type, filter });
	};

	getMonitorsWithChecksByTeamId = async ({
		teamId,
		limit,
		type,
		page,
		rowsPerPage,
		filter,
		field,
		order,
	}: {
		teamId: string;
		limit?: number;
		type?: MonitorType | MonitorType[];
		page?: number;
		rowsPerPage?: number;
		filter?: string;
		field?: string;
		order?: "asc" | "desc";
	}): Promise<MonitorsWithChecksByTeamIdResult> => {
		const summary = await this.monitorsRepository.findMonitorsSummaryByTeamId(teamId, { type });
		const count = await this.monitorsRepository.findMonitorCountByTeamIdAndType(teamId, { type, filter });
		const monitors = await this.monitorsRepository.findByTeamId(teamId, {
			limit,
			type,
			page,
			rowsPerPage,
			filter,
			field,
			order,
		});

		const monitorsList = (monitors ?? []) as Monitor[];
		const snapshotTypes: MonitorType[] = ["hardware"];
		const requestedTypes = Array.isArray(type) ? type : type ? [type] : [];
		const snapshotOnlyRequest =
			requestedTypes.length > 0 && requestedTypes.every((requestedType) => snapshotTypes.includes(requestedType as MonitorType));

		const monitorsWithChecks = monitorsList.map((monitor: Monitor) => {
			const rawChecks = monitor.recentChecks ?? [];
			const isSnapshotType = snapshotOnlyRequest || snapshotTypes.includes(monitor.type);
			const checks = isSnapshotType ? rawChecks.slice(0, 1) : NormalizeData(rawChecks, 10, 100);
			monitor.recentChecks = checks;
			return monitor;
		});
		return { summary: summary ?? null, count, monitors: monitorsWithChecks };
	};

	getAllGames = (): GamesMap => {
		return this.games;
	};

	getGroupsByTeamId = async ({ teamId }: { teamId: string }): Promise<string[]> => {
		return await this.monitorsRepository.findGroupsByTeamId(teamId);
	};

	editMonitor = async ({ teamId, monitorId, body }: { teamId: string; monitorId: string; body: Partial<Monitor> }) => {
		const editedMonitor = await this.monitorsRepository.updateById(monitorId, teamId, body);
		await this.jobQueue.updateJob(editedMonitor);
		return editedMonitor;
	};

	updateNotifications = async ({
		teamId,
		monitorIds,
		notificationIds,
		action,
	}: {
		teamId: string;
		monitorIds: string[];
		notificationIds: string[];
		action: "add" | "remove" | "set";
	}): Promise<number> => {
		const modifiedCount = await this.monitorsRepository.updateNotifications(teamId, monitorIds, notificationIds, action);

		// If notifications were updated, we should update the jobs in the queue
		if (modifiedCount > 0) {
			const monitors = await this.monitorsRepository.findByIds(monitorIds);
			await Promise.all(monitors.map((monitor) => this.jobQueue.updateJob(monitor)));
		}

		return modifiedCount;
	};

	pauseMonitor = async ({ teamId, monitorId }: { teamId: string; monitorId: string }): Promise<Monitor> => {
		const monitor = await this.monitorsRepository.togglePauseById(monitorId, teamId);
		if (monitor.isActive) {
			await this.jobQueue.resumeJob(monitor);
		} else {
			await this.jobQueue.pauseJob(monitor);
		}
		return monitor;
	};

	bulkPauseMonitors = async ({
		teamId,
		monitorIds,
		pause,
	}: {
		teamId: string;
		monitorIds: string[];
		pause: boolean;
	}): Promise<{ monitors: Monitor[]; failedCount: number }> => {
		const monitors = await this.monitorsRepository.bulkTogglePause(monitorIds, teamId, pause);

		const results = await Promise.allSettled(
			monitors.map(async (monitor) => {
				if (monitor.isActive) {
					await this.jobQueue.resumeJob(monitor);
				} else {
					await this.jobQueue.pauseJob(monitor);
				}
			})
		);

		let failedCount = 0;
		results.forEach((result, index) => {
			if (result.status === "rejected") {
				failedCount++;
				this.logger.error({
					message: `Failed to sync job queue for monitor ${monitors[index]?.id || "unknown"} during bulk ${pause ? "pause" : "resume"}`,
					service: SERVICE_NAME,
					method: "bulkPauseMonitors",
					stack: result.reason instanceof Error ? result.reason.stack : undefined,
				});
			}
		});

		return { monitors, failedCount };
	};

	deleteMonitor = async ({ teamId, monitorId }: { teamId: string; monitorId: string }): Promise<Monitor> => {
		const monitor = await this.monitorsRepository.deleteById(monitorId, teamId);
		await this.monitorStatsRepository.deleteByMonitorId(monitor.id).catch((err: unknown) => {
			this.logger.warn({
				message: `Error deleting monitor stats for monitor ${monitor.id} with name ${monitor.name}`,
				service: SERVICE_NAME,
				stack: err instanceof Error ? err.stack : undefined,
			});
		});
		await this.checksRepository.deleteByMonitorId(monitor.id).catch((err: unknown) => {
			this.logger.warn({
				message: `Error deleting checks for monitor ${monitor.id} with name ${monitor.name}`,
				service: SERVICE_NAME,
				stack: err instanceof Error ? err.stack : undefined,
			});
		});
		await this.statusPagesRepository.removeMonitorFromStatusPages(monitor.id).catch((err: unknown) => {
			this.logger.warn({
				message: `Error removing monitor ${monitor.id} with name ${monitor.name} from status pages`,
				service: SERVICE_NAME,
				stack: err instanceof Error ? err.stack : undefined,
			});
		});

		await this.incidentsRepository.deleteByMonitorId(monitor.id, teamId).catch((err: unknown) => {
			this.logger.warn({
				message: `Error deleting incidents for monitor ${monitor.id} with name ${monitor.name}`,
				service: SERVICE_NAME,
				stack: err instanceof Error ? err.stack : undefined,
			});
		});

		await this.geoChecksRepository.deleteByMonitorId(monitor.id).catch((err: unknown) => {
			this.logger.warn({
				message: `Error deleting geo checks for monitor ${monitor.id} with name ${monitor.name}`,
				service: SERVICE_NAME,
				stack: err instanceof Error ? err.stack : undefined,
			});
		});

		await this.jobQueue.deleteJob(monitor);
		return monitor;
	};

	deleteAllMonitors = async ({ teamId }: { teamId: string }): Promise<number> => {
		const { monitors, deletedCount } = await this.monitorsRepository.deleteByTeamId(teamId);
		await Promise.all(
			monitors.map(async (monitor) => {
				try {
					await this.jobQueue.deleteJob(monitor);
					await this.checksRepository.deleteByMonitorId(monitor.id);
					await this.geoChecksRepository.deleteByMonitorId(monitor.id);
					await this.statusPagesRepository.removeMonitorFromStatusPages(monitor.id);
					await this.monitorStatsRepository.deleteByMonitorId(monitor.id);
				} catch (error: unknown) {
					this.logger.warn({
						message: `Error deleting associated records for monitor ${monitor.id} with name ${monitor.name}`,
						service: SERVICE_NAME,
						method: "deleteAllMonitors",
						stack: error instanceof Error ? error.stack : undefined,
					});
				}
			})
		);
		return deletedCount;
	};

	exportMonitorsToJSON = async ({ teamId }: { teamId: string }): Promise<Monitor[]> => {
		const monitors = await this.monitorsRepository.findByTeamId(teamId, {});

		if (!monitors || monitors.length === 0) {
			throw new AppError({ message: "No monitors found to export.", service: SERVICE_NAME, method: "exportMonitorsToJSON", status: 400 });
		}

		return monitors;
	};

	importMonitorsFromJSON = async ({
		teamId,
		userId,
		monitors,
	}: {
		teamId: string;
		userId: string;
		monitors: ImportedMonitor[];
	}): Promise<{ imported: number; errors: string[] }> => {
		const errors: string[] = [];

		const cleanedMonitors: Monitor[] = monitors.map((monitor) => ({
			...monitor,
			id: "",
			teamId,
			userId,
			recentChecks: [],
			createdAt: "",
			updatedAt: "",
		}));

		const createdMonitors = await this.createMonitors(cleanedMonitors);

		return { imported: createdMonitors!.length, errors };
	};
}
