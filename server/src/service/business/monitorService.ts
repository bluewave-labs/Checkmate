import { createMonitorsBodyValidation } from "@/validation/joi.js";
import { NormalizeData } from "@/utils/dataUtils.js";
import { type Monitor } from "@/types/index.js";
import type { IMonitorsRepository } from "@/repositories/index.js";
import { AppError } from "../infrastructure/errorService.js";
const SERVICE_NAME = "MonitorService";

export interface IMonitorService {
	readonly serviceName: string;
	verifyTeamAccess(args: { teamId: string; monitorId: string }): Promise<void>;

	// create
	createMonitor(teamId: string, userId: string, body: Monitor): Promise<void>;
	createBulkMonitors(args: { fileData: string; userId: string; teamId: string }): Promise<any>;
	addDemoMonitors(args: { userId: string; teamId: string }): Promise<any[]>;

	// read
	getAllMonitors(): Promise<any[]>;
	getUptimeDetailsById(args: { teamId: string; monitorId: string; dateRange: string; normalize?: boolean }): Promise<any>;
	getMonitorStatsById(args: {
		teamId: string;
		monitorId: string;
		limit?: number;
		sortOrder?: 1 | -1;
		dateRange?: string;
		numToDisplay?: number;
		normalize?: boolean;
	}): Promise<any>;
	getHardwareDetailsById(args: { teamId: string; monitorId: string; dateRange: string }): Promise<any>;
	getMonitorById(args: { teamId: string; monitorId: string }): Promise<any>;
	getMonitorsByTeamId(args: {
		teamId: string;
		limit?: number;
		type?: string | string[];
		page?: number;
		rowsPerPage?: number;
		filter?: string;
		field?: string;
		order?: "asc" | "desc";
	}): Promise<any>;
	getMonitorsAndSummaryByTeamId(args: { teamId: string; type?: string | string[]; explain?: boolean }): Promise<any>;
	getMonitorsWithChecksByTeamId(args: {
		teamId: string;
		limit?: number;
		type?: string | string[];
		page?: number;
		rowsPerPage?: number;
		filter?: string;
		field?: string;
		order?: "asc" | "desc";
		explain?: boolean;
	}): Promise<{ count: number; monitors: any[] }>;
	getAllGames(): any;
	getGroupsByTeamId(args: { teamId: string }): Promise<any[]>;

	// update
	editMonitor(args: { teamId: string; monitorId: string; body: any }): Promise<void>;
	pauseMonitor(args: { teamId: string; monitorId: string }): Promise<any>;

	// delete
	deleteMonitor(args: { teamId: string; monitorId: string }): Promise<any>;
	deleteAllMonitors(args: { teamId: string }): Promise<number>;

	// other
	sendTestEmail(args: { to: string }): Promise<string>;
	exportMonitorsToCSV(args: { teamId: string }): Promise<string>;
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
	private checksRepository: any;

	constructor({
		db,
		jobQueue,
		stringService,
		emailService,
		papaparse,
		logger,
		errorService,
		games,
		monitorsRepository,
		checksRepository,
	}: {
		db: any;
		jobQueue: any;
		stringService: any;
		emailService: any;
		papaparse: any;
		logger: any;
		errorService: any;
		games: any;
		monitorsRepository: IMonitorsRepository;
		checksRepository: any;
	}) {
		this.db = db;
		this.jobQueue = jobQueue;
		this.stringService = stringService;
		this.emailService = emailService;
		this.papaparse = papaparse;
		this.logger = logger;
		this.errorService = errorService;
		this.games = games;
		this.monitorsRepository = monitorsRepository;
		this.checksRepository = checksRepository;
	}

	get serviceName(): string {
		return MonitorService.SERVICE_NAME;
	}

	verifyTeamAccess = async ({ teamId, monitorId }: { teamId: string; monitorId: string }): Promise<void> => {
		const monitor = await this.db.monitorModule.getMonitorById(monitorId);
		if (!monitor?.teamId?.equals(teamId)) {
			throw this.errorService.createAuthorizationError();
		}
	};

	createMonitor = async (teamId: string, userId: string, body: Monitor): Promise<void> => {
		const monitor = await this.monitorsRepository.create(body, teamId, userId);
		if (!monitor) {
			throw new AppError("Failed to create monitor", 500);
		}

		this.jobQueue.addJob(monitor.id, monitor);
	};

	createBulkMonitors = async ({ fileData, userId, teamId }: { fileData: string; userId: string; teamId: string }): Promise<any> => {
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

						const enrichedData = data.map((monitor: any) => ({
							userId,
							teamId,
							...monitor,
							description: monitor.description || monitor.name || monitor.url,
							name: monitor.name || monitor.url,
							type: monitor.type || "http",
						}));

						await createMonitorsBodyValidation.validateAsync(enrichedData);

						const monitors = await this.db.monitorModule.createBulkMonitors(enrichedData);

						await Promise.all(
							monitors.map(async (monitor: any) => {
								this.jobQueue.addJob(monitor._id, monitor);
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
		const demoMonitors = await this.db.monitorModule.addDemoMonitors(userId, teamId);

		await Promise.all(demoMonitors.map((monitor: any) => this.jobQueue.addJob(monitor._id, monitor)));
		return demoMonitors;
	};

	getAllMonitors = async (): Promise<any[]> => {
		const monitors = await this.db.monitorModule.getAllMonitors();
		return monitors;
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
		await this.verifyTeamAccess({ teamId, monitorId });
		const data = await this.db.monitorModule.getUptimeDetailsById({
			monitorId,
			dateRange,
			normalize,
		});

		return data;
	};

	getMonitorStatsById = async ({
		teamId,
		monitorId,
		limit,
		sortOrder,
		dateRange,
		numToDisplay,
		normalize,
	}: {
		teamId: string;
		monitorId: string;
		limit?: number;
		sortOrder?: 1 | -1;
		dateRange?: string;
		numToDisplay?: number;
		normalize?: boolean;
	}): Promise<any> => {
		await this.verifyTeamAccess({ teamId, monitorId });
		const monitorStats = await this.db.monitorModule.getMonitorStatsById({
			monitorId,
			limit,
			sortOrder,
			dateRange,
			numToDisplay,
			normalize,
		});

		return monitorStats;
	};

	getHardwareDetailsById = async ({ teamId, monitorId, dateRange }: { teamId: string; monitorId: string; dateRange: string }): Promise<any> => {
		await this.verifyTeamAccess({ teamId, monitorId });
		const monitor = await this.db.monitorModule.getHardwareDetailsById({ monitorId, dateRange });

		return monitor;
	};

	getMonitorById = async ({ teamId, monitorId }: { teamId: string; monitorId: string }): Promise<any> => {
		await this.verifyTeamAccess({ teamId, monitorId });
		const monitor = await this.db.monitorModule.getMonitorById(monitorId);

		return monitor;
	};

	getMonitorsByTeamId = async ({
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
		type?: string | string[];
		page?: number;
		rowsPerPage?: number;
		filter?: string;
		field?: string;
		order?: "asc" | "desc";
	}): Promise<any> => {
		const monitors = await this.db.monitorModule.getMonitorsByTeamId({
			limit,
			type,
			page,
			rowsPerPage,
			filter,
			field,
			order,
			teamId,
		});
		return monitors;
	};

	getMonitorsAndSummaryByTeamId = async ({
		teamId,
		type,
		explain,
	}: {
		teamId: string;
		type?: string | string[];
		explain?: boolean;
	}): Promise<any> => {
		const result = await this.db.monitorModule.getMonitorsAndSummaryByTeamId({
			type,
			explain,
			teamId,
		});
		return result;
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
		type?: string | string[];
		page?: number;
		rowsPerPage?: number;
		filter?: string;
		field?: string;
		order?: "asc" | "desc";
		explain?: boolean;
	}): Promise<{ count: number; monitors: any[] }> => {
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

		const monitorIds = monitors?.map((m: any) => m.id) ?? [];
		const checksMap = await this.checksRepository.findLatestChecksByMonitorIds(monitorIds);
		const monitorsWithChecks = (monitors ?? []).map((monitor: any) => {
			const checks = NormalizeData(checksMap[monitor.id] ?? [], 10, 100);
			return {
				...monitor,
				checks,
			};
		});

		return { count, monitors: monitorsWithChecks };
	};

	getAllGames = (): any => {
		return this.games;
	};

	getGroupsByTeamId = async ({ teamId }: { teamId: string }): Promise<any[]> => {
		const groups = await this.db.monitorModule.getGroupsByTeamId({ teamId });
		return groups;
	};

	editMonitor = async ({ teamId, monitorId, body }: { teamId: string; monitorId: string; body: any }): Promise<void> => {
		await this.verifyTeamAccess({ teamId, monitorId });
		const editedMonitor = await this.db.monitorModule.editMonitor({ monitorId, body });
		await this.jobQueue.updateJob(editedMonitor);
	};

	pauseMonitor = async ({ teamId, monitorId }: { teamId: string; monitorId: string }): Promise<any> => {
		await this.verifyTeamAccess({ teamId, monitorId });
		const monitor = await this.db.monitorModule.pauseMonitor({ monitorId });
		monitor.isActive === true ? await this.jobQueue.resumeJob(monitor._id, monitor) : await this.jobQueue.pauseJob(monitor);
		return monitor;
	};

	deleteMonitor = async ({ teamId, monitorId }: { teamId: string; monitorId: string }): Promise<any> => {
		await this.verifyTeamAccess({ teamId, monitorId });
		const monitor = await this.db.monitorModule.deleteMonitor({ teamId, monitorId });
		await this.jobQueue.deleteJob(monitor);
		await this.db.statusPageModule.deleteStatusPagesByMonitorId(monitor._id);
		return monitor;
	};

	deleteAllMonitors = async ({ teamId }: { teamId: string }): Promise<number> => {
		const { monitors, deletedCount } = await this.db.monitorModule.deleteAllMonitors(teamId);
		await Promise.all(
			monitors.map(async (monitor: any) => {
				try {
					await this.jobQueue.deleteJob(monitor);
					await this.db.checkModule.deleteChecks(monitor._id);
					await this.db.pageSpeedCheckModule.deletePageSpeedChecksByMonitorId(monitor._id);
					await this.db.notificationsModule.deleteNotificationsByMonitorId(monitor._id);
				} catch (error: any) {
					this.logger.warn({
						message: `Error deleting associated records for monitor ${monitor._id} with name ${monitor.name}`,
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

	exportMonitorsToCSV = async ({ teamId }: { teamId: string }): Promise<string> => {
		const monitors = await this.db.monitorModule.getMonitorsByTeamId({ teamId });

		if (!monitors || monitors.length === 0) {
			throw this.errorService.createNotFoundError("No monitors to export");
		}

		const csvData = monitors?.filteredMonitors?.map((monitor: any) => ({
			name: monitor.name,
			description: monitor.description,
			type: monitor.type,
			url: monitor.url,
			interval: monitor.interval,
			port: monitor.port,
			ignoreTlsErrors: monitor.ignoreTlsErrors,
			isActive: monitor.isActive,
		}));

		const csv = this.papaparse.unparse(csvData);
		return csv;
	};
	exportMonitorsToJSON = async ({ teamId }: { teamId: string }): Promise<any[]> => {
		const monitors = await this.db.monitorModule.getMonitorsByTeamId({ teamId });

		if (!monitors || monitors.length === 0) {
			throw this.errorService.createNotFoundError("No monitors to export");
		}

		const json = monitors?.filteredMonitors
			?.map((monitor: any) => {
				const initialType = monitor.type;
				let parsedType;

				if (initialType === "hardware") {
					parsedType = "infrastructure";
				} else if (initialType === "http") {
					if (monitor.url.startsWith("https://")) {
						parsedType = "https";
					} else {
						parsedType = "http";
					}
				} else if (initialType === "pagespeed") {
					parsedType = initialType;
				} else {
					// Skip unsupported types
					return;
				}

				return {
					name: monitor.name,
					url: monitor.url,
					type: parsedType,
					interval: monitor.interval,
					n: monitor.statusWindowSize,
					secret: monitor.secret,
				};
			})
			.filter(Boolean);

		return json;
	};
}
