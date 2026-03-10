import { NormalizeData, NormalizeDataUptimeDetails } from "@/utils/dataUtils.js";
import { type Monitor } from "@/types/index.js";
import type {
	MonitorType,
	MonitorsWithChecksByTeamIdResult,
	UptimeDetailsResult,
	HardwareDetailsResult,
	PageSpeedDetailsResult,
	GamesMap,
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
import { ISuperSimpleQueue } from "../infrastructure/SuperSimpleQueue/SuperSimpleQueue.js";

const SERVICE_NAME = "MonitorService";
type DateRangeKey = "recent" | "day" | "week" | "month" | "all";

export interface IMonitorService {
	readonly serviceName: string;

	// create
	createMonitor(teamId: string, userId: string, body: Monitor): Promise<void>;
	createMonitors(monitors: Array<Monitor>, userId: string, teamId: string): Promise<Monitor[] | null>;
	addDemoMonitors(args: { userId: string; teamId: string }): Promise<Monitor[]>;

	// read
	getUptimeDetailsById(args: { teamId: string; monitorId: string; dateRange: string; normalize?: boolean }): Promise<UptimeDetailsResult>;
	getHardwareDetailsById(args: { teamId: string; monitorId: string; dateRange: string }): Promise<HardwareDetailsResult>;
	getPageSpeedDetailsById(args: { teamId: string; monitorId: string; dateRange: string }): Promise<PageSpeedDetailsResult>;
	getGeoChecksByMonitorId(args: { teamId: string; monitorId: string; dateRange: string; continents?: GeoContinent[] }): Promise<any>;
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
		explain?: boolean;
	}): Promise<MonitorsWithChecksByTeamIdResult>;
	getAllGames(): GamesMap;
	getGroupsByTeamId(args: { teamId: string }): Promise<string[]>;

	// update
	editMonitor(args: { teamId: string; monitorId: string; body: Monitor }): Promise<Monitor>;
	pauseMonitor(args: { teamId: string; monitorId: string }): Promise<Monitor>;

	// delete
	deleteMonitor(args: { teamId: string; monitorId: string }): Promise<Monitor>;
	deleteAllMonitors(args: { teamId: string }): Promise<number>;

	// notifications
	updateNotifications(args: { teamId: string; monitorIds: string[]; notificationIds: string[]; action: "add" | "remove" | "set" }): Promise<number>;

	// other
	sendTestEmail(args: { to: string }): Promise<string>;
	exportMonitorsToJSON(args: { teamId: string }): Promise<Monitor[]>;
	importMonitorsFromJSON(args: { teamId: string; userId: string; monitors: any[] }): Promise<{ imported: number; errors: string[] }>;
}

export class MonitorService implements IMonitorService {
	static SERVICE_NAME = SERVICE_NAME;

	private jobQueue: ISuperSimpleQueue;
	private emailService: any;
	private logger: any;
	private games: any;
	private monitorsRepository: IMonitorsRepository;
	private checksRepository: IChecksRepository;
	private geoChecksRepository: IGeoChecksRepository;
	private monitorStatsRepository: IMonitorStatsRepository;
	private statusPagesRepository: IStatusPagesRepository;
	private incidentsRepository: IIncidentsRepository;

	constructor({
		jobQueue,
		emailService,
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
		emailService: any;
		logger: any;
		games: any;
		monitorsRepository: IMonitorsRepository;
		checksRepository: IChecksRepository;
		geoChecksRepository: IGeoChecksRepository;
		monitorStatsRepository: IMonitorStatsRepository;
		statusPagesRepository: IStatusPagesRepository;
		incidentsRepository: IIncidentsRepository;
	}) {
		this.jobQueue = jobQueue;
		this.emailService = emailService;
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

	createMonitors = async (monitors: Array<Monitor>, userId: string, teamId: string): Promise<Monitor[] | null> => {
		const createdMonitors = await this.monitorsRepository.createMonitors(monitors);
		if (!monitors || monitors.length === 0) {
			throw new AppError({ message: "Failed to create monitors", status: 500, service: SERVICE_NAME, method: "createMonitors" });
		}

		await Promise.all(createdMonitors.map((monitor) => this.jobQueue.addJob(monitor.id, monitor)));
		return createdMonitors;
	};

	addDemoMonitors = async ({ userId, teamId }: { userId: string; teamId: string }): Promise<any[]> => {
		const demoData = demoMonitorsData;
		const monitors = demoData.map((monitor) => ({
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
		normalize,
	}: {
		teamId: string;
		monitorId: string;
		dateRange: string;
		normalize?: boolean;
	}): Promise<UptimeDetailsResult> => {
		const monitor = await this.monitorsRepository.findById(monitorId, teamId);
		if (!monitor) {
			throw new AppError({ message: `Monitor with ID ${monitorId} not found.`, status: 404 });
		}
		const rangeKey = (dateRange as DateRangeKey) ?? "recent";
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
			checksData.monitorType !== "websocket"
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

		const rangeKey = (dateRange as DateRangeKey) ?? "recent";
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

		const rangeKey = (dateRange as DateRangeKey) ?? "recent";
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
	}): Promise<any> => {
		const monitor = await this.monitorsRepository.findById(monitorId, teamId);
		if (!monitor) {
			throw new AppError({ message: `Monitor with ID ${monitorId} not found.`, status: 404 });
		}

		if (!supportsGeoCheck(monitor.type) || !monitor.geoCheckEnabled) {
			return { groupedGeoChecks: [] };
		}

		const rangeKey = (dateRange as DateRangeKey) ?? "recent";
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
		const monitor = await this.monitorsRepository.findById(monitorId, teamId);
		return monitor;
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
		const monitors = await this.monitorsRepository.findByTeamId(teamId, {
			type,
			filter,
		});
		return monitors;
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
		explain,
	}: {
		teamId: string;
		limit?: number;
		type?: MonitorType | MonitorType[];
		page?: number;
		rowsPerPage?: number;
		filter?: string;
		field?: string;
		order?: "asc" | "desc";
		explain?: boolean;
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
		const groups = await this.monitorsRepository.findGroupsByTeamId(teamId);
		return groups;
	};

	editMonitor = async ({ teamId, monitorId, body }: { teamId: string; monitorId: string; body: Monitor }) => {
		const editedMonitor = await this.monitorsRepository.updateById(monitorId, teamId, body);
		await this.jobQueue.updateJob(editedMonitor);
		return editedMonitor;
	};

	updateNotifications = async ({ teamId, monitorIds, notificationIds, action }: { teamId: string; monitorIds: string[]; notificationIds: string[]; action: "add" | "remove" | "set" }): Promise<number> => {
		const modifiedCount = await this.monitorsRepository.updateNotifications(monitorIds, notificationIds, action, teamId);
		
		// If notifications were updated, we should update the jobs in the queue
		if (modifiedCount > 0) {
			const monitors = await this.monitorsRepository.findByIds(monitorIds);
			await Promise.all(monitors.map(monitor => this.jobQueue.updateJob(monitor)));
		}
		
		return modifiedCount;
	};

	pauseMonitor = async ({ teamId, monitorId }: { teamId: string; monitorId: string }): Promise<Monitor> => {
		const monitor = await this.monitorsRepository.togglePauseById(monitorId, teamId);
		monitor.isActive === true ? await this.jobQueue.resumeJob(monitor) : await this.jobQueue.pauseJob(monitor);
		return monitor;
	};

	deleteMonitor = async ({ teamId, monitorId }: { teamId: string; monitorId: string }): Promise<Monitor> => {
		const monitor = await this.monitorsRepository.deleteById(monitorId, teamId);
		await this.monitorStatsRepository.deleteByMonitorId(monitor.id).catch((err: any) => {
			this.logger.warn({
				message: `Error deleting monitor stats for monitor ${monitor.id} with name ${monitor.name}`,
				service: SERVICE_NAME,
				stack: err.stack,
			});
		});
		await this.checksRepository.deleteByMonitorId(monitor.id).catch((err: any) => {
			this.logger.warn({
				message: `Error deleting checks for monitor ${monitor.id} with name ${monitor.name}`,
				service: SERVICE_NAME,
				stack: err.stack,
			});
		});
		await this.statusPagesRepository.removeMonitorFromStatusPages(monitor.id).catch((err: any) => {
			this.logger.warn({
				message: `Error removing monitor ${monitor.id} with name ${monitor.name} from status pages`,
				service: SERVICE_NAME,
				stack: err.stack,
			});
		});

		await this.incidentsRepository.deleteByMonitorId(monitor.id, teamId).catch((err: any) => {
			this.logger.warn({
				message: `Error deleting incidents for monitor ${monitor.id} with name ${monitor.name}`,
				service: SERVICE_NAME,
				stack: err.stack,
			});
		});

		await this.geoChecksRepository.deleteByMonitorId(monitor.id).catch((err: any) => {
			this.logger.warn({
				message: `Error deleting geo checks for monitor ${monitor.id} with name ${monitor.name}`,
				service: SERVICE_NAME,
				stack: err.stack,
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
				} catch (error: any) {
					this.logger.warn({
						message: `Error deleting associated records for monitor ${monitor.id} with name ${monitor.name}`,
						service: SERVICE_NAME,
						method: "deleteAllMonitors",
						stack: error.stack,
					});
				}
			})
		);
		return deletedCount;
	};

	sendTestEmail = async ({ to }: { to: string }): Promise<string> => {
		const subject = "Test email from Checkmate";
		const context = { testName: "Monitoring System" };

		const html = await this.emailService.buildEmail("testEmailTemplate", context);
		const messageId = await this.emailService.sendEmail(to, subject, html);

		if (!messageId) {
			throw new AppError({ message: "Failed to send test email.", service: SERVICE_NAME, method: "sendTestEmail", status: 500 });
		}

		return messageId;
	};

	exportMonitorsToJSON = async ({ teamId }: { teamId: string }): Promise<any[]> => {
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
		monitors: any[];
	}): Promise<{ imported: number; errors: string[] }> => {
		const errors: string[] = [];

		const cleanedMonitors = monitors.map((monitor) => {
			const cleanData = { ...monitor };
			delete cleanData.id;
			delete cleanData._id;
			delete cleanData.createdAt;
			delete cleanData.updatedAt;
			delete cleanData.recentChecks;
			// Monitors must belong to current team
			cleanData.teamId = teamId;
			return cleanData;
		});

		const createdMonitors = await this.createMonitors(cleanedMonitors, userId, teamId);

		if (!createdMonitors || createdMonitors.length === 0) {
			throw new AppError({
				message: "Failed to import any monitors. Please check the file format and try again.",
				service: SERVICE_NAME,
				method: "importMonitorsFromJSON",
				status: 400,
			});
		}

		return { imported: createdMonitors.length, errors };
	};
}
