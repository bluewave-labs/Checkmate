import { createMonitorsBodyValidation } from "@/validation/joi.js";
import { NormalizeData, NormalizeDataUptimeDetails } from "@/utils/dataUtils.js";
import { type Monitor } from "@/types/index.js";
import type { MonitorType } from "@/types/monitor.js";
import type { IChecksRepository, IMonitorsRepository, IMonitorStatsRepository, IStatusPagesRepository } from "@/repositories/index.js";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

import { AppError } from "../infrastructure/errorService.js";

const SERVICE_NAME = "MonitorService";
type DateRangeKey = "recent" | "day" | "week" | "month" | "all";

export interface IMonitorService {
	readonly serviceName: string;

	// create
	createMonitor(teamId: string, userId: string, body: Monitor): Promise<void>;
	createBulkMonitors(fileData: string, userId: string, teamId: string): Promise<any>;
	addDemoMonitors(args: { userId: string; teamId: string }): Promise<any[]>;

	// read
	getUptimeDetailsById(args: { teamId: string; monitorId: string; dateRange: string; normalize?: boolean }): Promise<any>;
	getHardwareDetailsById(args: { teamId: string; monitorId: string; dateRange: string }): Promise<any>;
	getPageSpeedDetailsById(args: { teamId: string; monitorId: string; dateRange: string }): Promise<any>;
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
	}): Promise<any>;
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
	}): Promise<{ summary: any; count: number; monitors: any[] }>;
	getAllGames(): any;
	getGroupsByTeamId(args: { teamId: string }): Promise<string[]>;

	// update
	editMonitor(args: { teamId: string; monitorId: string; body: Monitor }): Promise<Monitor>;
	pauseMonitor(args: { teamId: string; monitorId: string }): Promise<Monitor>;

	// delete
	deleteMonitor(args: { teamId: string; monitorId: string }): Promise<Monitor>;
	deleteAllMonitors(args: { teamId: string }): Promise<number>;

	// other
	sendTestEmail(args: { to: string }): Promise<string>;
	exportMonitorsToJSON(args: { teamId: string }): Promise<any[]>;
}

export class MonitorService implements IMonitorService {
	static SERVICE_NAME = SERVICE_NAME;

	private db: any;
	private jobQueue: any;
	private stringService: any;
	private emailService: any;
	private papaparse: any;
	private logger: any;
	private errorService: any;
	private games: any;
	private monitorsRepository: IMonitorsRepository;
	private checksRepository: IChecksRepository;
	private monitorStatsRepository: IMonitorStatsRepository;
	private statusPagesRepository: IStatusPagesRepository;

	constructor({
		jobQueue,
		stringService,
		emailService,
		papaparse,
		logger,
		errorService,
		games,
		monitorsRepository,
		checksRepository,
		monitorStatsRepository,
		statusPagesRepository,
	}: {
		jobQueue: any;
		stringService: any;
		emailService: any;
		papaparse: any;
		logger: any;
		errorService: any;
		games: any;
		monitorsRepository: IMonitorsRepository;
		checksRepository: IChecksRepository;
		monitorStatsRepository: IMonitorStatsRepository;
		statusPagesRepository: IStatusPagesRepository;
	}) {
		this.jobQueue = jobQueue;
		this.stringService = stringService;
		this.emailService = emailService;
		this.papaparse = papaparse;
		this.logger = logger;
		this.errorService = errorService;
		this.games = games;
		this.monitorsRepository = monitorsRepository;
		this.checksRepository = checksRepository;
		this.monitorStatsRepository = monitorStatsRepository;
		this.statusPagesRepository = statusPagesRepository;
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
			throw new AppError("Failed to create monitor", 500);
		}

		this.jobQueue.addJob(monitor.id, monitor);
	};

	createBulkMonitors = async (fileData: string, userId: string, teamId: string): Promise<any> => {
		const { parse } = this.papaparse;

		return new Promise<any>((resolve, reject) => {
			parse(fileData, {
				header: true,
				skipEmptyLines: true,
				transform: (value: string, header: string): string | number | undefined => {
					if (value === "") return undefined; // Empty fields become undefined

					// Handle 'port' and 'interval' fields, check if they're valid numbers
					if (["port", "interval"].includes(header)) {
						const num = parseInt(value, 10);
						if (isNaN(num)) {
							throw this.errorService.createBadRequestError(`${header} should be a valid number, got: ${value}`);
						}
						return num;
					}

					return value;
				},
				complete: async ({ data, errors }: { data: any[]; errors: Error[] }): Promise<void> => {
					try {
						if (errors.length > 0) {
							throw this.errorService.createServerError("Error parsing CSV");
						}

						if (!data || data.length === 0) {
							throw this.errorService.createServerError("CSV file contains no data rows");
						}

						const enrichedData = data.map((monitor: Monitor) => ({
							...monitor,
							userId,
							teamId,
							description: monitor.description || monitor.name || monitor.url,
							name: monitor.name || monitor.url,
							type: monitor.type || "http",
						}));

						await createMonitorsBodyValidation.validateAsync(enrichedData);

						const monitors = await this.monitorsRepository.createBulkMonitors(enrichedData);

						await Promise.all(
							monitors.map(async (monitor: Monitor) => {
								this.jobQueue.addJob(monitor.id, monitor);
							})
						);

						resolve(monitors);
					} catch (error) {
						reject(error);
					}
				},
			});
		});
	};

	addDemoMonitors = async ({ userId, teamId }: { userId: string; teamId: string }): Promise<any[]> => {
		const __filename = fileURLToPath(import.meta.url);
		const __dirname = path.dirname(__filename);
		const demoMonitorsPath = path.resolve(__dirname, "../../utils/demoMonitors.json");

		const demoData = JSON.parse(fs.readFileSync(demoMonitorsPath, "utf8"));
		const monitors: Monitor[] = demoData.map((monitor: Monitor) => {
			return {
				userId,
				teamId,
				name: monitor.name,
				description: monitor.name,
				type: "http",
				url: monitor.url,
				interval: 60000,
			};
		});
		const demoMonitors = await this.monitorsRepository.createBulkMonitors(monitors);

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
	}): Promise<any> => {
		const monitor = await this.monitorsRepository.findById(monitorId, teamId);
		if (!monitor) {
			throw new AppError({ message: `Monitor with ID ${monitorId} not found.`, status: 404 });
		}
		const rangeKey = (dateRange as DateRangeKey) ?? "recent";
		const { start, end } = this.getDateRange(rangeKey);
		const checksData = await this.checksRepository.findDateRangeChecksByMonitor(monitor.id, start, end, this.getDateFormat(rangeKey), {
			type: monitor.type,
		});
		const monitorStats = await this.monitorStatsRepository.findByMonitorId(monitor.id);

		if (
			checksData.monitorType !== "http" &&
			checksData.monitorType !== "ping" &&
			checksData.monitorType !== "docker" &&
			checksData.monitorType !== "port" &&
			checksData.monitorType !== "game"
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

	getHardwareDetailsById = async ({ teamId, monitorId, dateRange }: { teamId: string; monitorId: string; dateRange: string }): Promise<any> => {
		const monitor = await this.monitorsRepository.findById(monitorId, teamId);
		if (!monitor) {
			throw new AppError({ message: `Monitor with ID ${monitorId} not found.`, status: 404 });
		}
		if (monitor.type !== "hardware") {
			throw new AppError({ message: `${monitor.type} monitors are not supported for hardware details`, status: 400 });
		}

		const rangeKey = (dateRange as DateRangeKey) ?? "recent";
		const { start, end } = this.getDateRange(rangeKey);
		const checksData = await this.checksRepository.findDateRangeChecksByMonitor(monitor.id, start, end, this.getDateFormat(rangeKey), {
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

		return {
			...monitor,
			stats,
		};
	};

	getPageSpeedDetailsById = async ({ teamId, monitorId, dateRange }: { teamId: string; monitorId: string; dateRange: string }): Promise<any> => {
		const monitor = await this.monitorsRepository.findById(monitorId, teamId);
		if (!monitor) {
			throw new AppError({ message: `Monitor with ID ${monitorId} not found.`, status: 404 });
		}
		if (monitor.type !== "pagespeed") {
			throw new AppError({ message: `${monitor.type} monitors are not supported for pagespeed details`, status: 400 });
		}

		const rangeKey = (dateRange as DateRangeKey) ?? "recent";
		const { start, end } = this.getDateRange(rangeKey);
		const checksData = await this.checksRepository.findDateRangeChecksByMonitor(monitor.id, start, end, this.getDateFormat(rangeKey), {
			type: monitor.type,
		});

		if (checksData.monitorType !== "pagespeed") {
			throw new AppError({ message: "Unable to load pagespeed stats for this monitor", status: 500 });
		}

		const monitorStats = await this.monitorStatsRepository.findByMonitorId(monitor.id);

		return {
			monitor: {
				...monitor,
				checks: checksData.checks,
			},
			monitorStats,
		};
	};
	getMonitorById = async ({ teamId, monitorId }: { teamId: string; monitorId: string }): Promise<any> => {
		const monitor = await this.monitorsRepository.findById(monitorId, teamId);
		return monitor;
	};

	getMonitorsByTeamId = async ({ teamId, type, filter }: { teamId: string; type?: MonitorType | MonitorType[]; filter?: string }): Promise<any> => {
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
	}): Promise<{ summary: any; count: number; monitors: any[] }> => {
		const summary = await this.monitorsRepository.findMonitorsSummaryByTeamId(teamId);
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
		const snapshotTypes: MonitorType[] = ["hardware", "pagespeed"];
		const requestedTypes = Array.isArray(type) ? type : type ? [type] : [];
		const snapshotOnlyRequest =
			requestedTypes.length > 0 && requestedTypes.every((requestedType) => snapshotTypes.includes(requestedType as MonitorType));

		const limitPerMonitor = snapshotOnlyRequest ? 1 : 25;
		const checksMap = await this.checksRepository.findLatestChecksByMonitorIds(
			monitorsList.map((monitor) => monitor.id),
			{ limitPerMonitor }
		);

		const monitorsWithChecks = monitorsList.map((monitor: Monitor) => {
			const rawChecks = checksMap[monitor.id] ?? [];
			const isSnapshotType = snapshotOnlyRequest || snapshotTypes.includes(monitor.type);
			const checks = isSnapshotType ? rawChecks.slice(0, 1) : NormalizeData(rawChecks, 10, 100);
			return {
				...monitor,
				checks,
			};
		});

		return { summary: summary ?? null, count, monitors: monitorsWithChecks };
	};

	getAllGames = (): any => {
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

	pauseMonitor = async ({ teamId, monitorId }: { teamId: string; monitorId: string }): Promise<Monitor> => {
		const monitor = await this.monitorsRepository.togglePauseById(monitorId, teamId);
		monitor.isActive === true ? await this.jobQueue.resumeJob(monitor) : await this.jobQueue.pauseJob(monitor);
		return monitor;
	};

	deleteMonitor = async ({ teamId, monitorId }: { teamId: string; monitorId: string }): Promise<Monitor> => {
		const monitor = await this.monitorsRepository.deleteById(monitorId, teamId);
		await this.monitorStatsRepository.deleteByMonitorId(monitor.id);
		await this.checksRepository.deleteByMonitorId(monitor.id);
		await this.statusPagesRepository.removeMonitorFromStatusPages(monitor.id);
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
		const subject = this.stringService.testEmailSubject;
		const context = { testName: "Monitoring System" };

		const html = await this.emailService.buildEmail("testEmailTemplate", context);
		const messageId = await this.emailService.sendEmail(to, subject, html);

		if (!messageId) {
			throw this.errorService.createServerError("Failed to send test email.");
		}

		return messageId;
	};

	exportMonitorsToJSON = async ({ teamId }: { teamId: string }): Promise<any[]> => {
		const monitors = await this.monitorsRepository.findByTeamId(teamId, {});

		if (!monitors || monitors.length === 0) {
			throw this.errorService.createNotFoundError("No monitors to export");
		}

		return monitors;
	};
}
