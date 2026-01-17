import { IChecksRepository, IMonitorsRepository } from "@/repositories/index.js";
import type { MonitorType, MonitorStatusResponse, CheckErrorInfo, Check } from "@/types/index.js";
import type { HardwareStatusPayload, PageSpeedStatusPayload } from "@/types/network.js";

const SERVICE_NAME = "checkService";

class CheckService {
	static SERVICE_NAME = SERVICE_NAME;

	private db: any;
	private settingsService: any;
	private stringService: any;
	private errorService: any;
	private monitorsRepository: IMonitorsRepository;
	private checksRepository: IChecksRepository;
	private logger: any;
	constructor({
		db,
		settingsService,
		stringService,
		errorService,
		monitorsRepository,
		logger,
		checksRepository,
	}: {
		db: any;
		settingsService: any;
		stringService: any;
		errorService: any;
		monitorsRepository: IMonitorsRepository;
		logger: any;
		checksRepository: IChecksRepository;
	}) {
		this.db = db;
		this.settingsService = settingsService;
		this.stringService = stringService;
		this.errorService = errorService;
		this.monitorsRepository = monitorsRepository;
		this.logger = logger;
		this.checksRepository = checksRepository;
	}

	get serviceName() {
		return CheckService.SERVICE_NAME;
	}

	createChecks = async (checks: Check[]) => {
		return this.checksRepository.createChecks(checks);
	};

	buildCheck = (statusResponse: MonitorStatusResponse<PageSpeedStatusPayload | HardwareStatusPayload | undefined>) => {
		const { monitorId, teamId, type, status, responseTime, code, message, payload, timings } = statusResponse;

		const check: Partial<Check> = {
			metadata: {
				monitorId,
				teamId,
				type,
			},
			status,
			statusCode: code,
			responseTime: responseTime || 0,
			timings: timings,
			message,
		};

		if (type === "pagespeed") {
			const pageSpeedPayload = payload as PageSpeedStatusPayload | undefined;
			if (!pageSpeedPayload) {
				this.logger.warn({
					message: "Failed to build check",
					service: SERVICE_NAME,
					method: "buildCheck",
					details: "empty payload",
				});
				return undefined;
			}
			const categories = pageSpeedPayload.lighthouseResult?.categories ?? {};
			const audits = pageSpeedPayload.lighthouseResult?.audits ?? {};
			const mapAudit = (audit: any) => {
				if (!audit || typeof audit !== "object") {
					return undefined;
				}
				return {
					id: audit.id,
					title: audit.title,
					score: typeof audit.score === "number" ? audit.score : (audit.score ?? null),
					displayValue: audit.displayValue,
					numericValue: typeof audit.numericValue === "number" ? audit.numericValue : undefined,
					numericUnit: audit.numericUnit,
				};
			};
			check.accessibility = (categories?.accessibility?.score || 0) * 100;
			check.bestPractices = (categories?.["best-practices"]?.score || 0) * 100;
			check.seo = (categories?.seo?.score || 0) * 100;
			check.performance = (categories?.performance?.score || 0) * 100;
			check.audits = {
				cls: mapAudit(audits?.["cumulative-layout-shift"]),
				si: mapAudit(audits?.["speed-index"]),
				fcp: mapAudit(audits?.["first-contentful-paint"]),
				lcp: mapAudit(audits?.["largest-contentful-paint"]),
				tbt: mapAudit(audits?.["total-blocking-time"]),
			};
		}

		if (type === "hardware") {
			const hardwarePayload = payload as HardwareStatusPayload | undefined;
			const { cpu, memory, disk, host, net, containers } = hardwarePayload?.data ?? {};
			const errorsSource = Array.isArray(hardwarePayload?.errors)
				? hardwarePayload?.errors
				: (hardwarePayload?.errors as { errors?: CheckErrorInfo[] } | undefined)?.errors;
			check.cpu = cpu;
			check.memory = memory;
			check.disk = disk;
			check.host = host;
			check.errors = errorsSource;
			check.capture = hardwarePayload?.capture;
			check.net = net;
			check.containers = containers;
		}
		return check;
	};

	getChecksByMonitor = async ({ monitorId, query, teamId }: { monitorId: string; query: any; teamId: string }) => {
		if (!monitorId) {
			throw this.errorService.createBadRequestError("No monitor ID in request");
		}

		if (!teamId) {
			throw this.errorService.createBadRequestError("No team ID in request");
		}

		// For verificaiton, throws an error if monitor doesn't belong to team
		await this.monitorsRepository.findById(monitorId, teamId);

		let { sortOrder, dateRange, filter, ack, page, rowsPerPage, status } = query;
		const result = await this.db.checkModule.getChecksByMonitor({
			monitorId,
			sortOrder,
			dateRange,
			filter,
			ack,
			page,
			rowsPerPage,
			status,
		});
		return result;
	};

	getChecksByTeam = async ({ teamId, query }: { teamId: string; query: any }) => {
		let { sortOrder, dateRange, filter, ack, page, rowsPerPage } = query;

		if (!teamId) {
			throw this.errorService.createBadRequestError("No team ID in request");
		}

		const checkData = await this.db.checkModule.getChecksByTeam({
			sortOrder,
			dateRange,
			filter,
			ack,
			page,
			rowsPerPage,
			teamId,
		});
		return checkData;
	};

	getChecksSummaryByTeamId = async ({ teamId }: { teamId: string }) => {
		if (!teamId) {
			throw this.errorService.createBadRequestError("No team ID in request");
		}

		const summary = await this.db.checkModule.getChecksSummaryByTeamId({ teamId });
		return summary;
	};

	ackCheck = async ({ checkId, teamId, ack }: { checkId: string; teamId: string; ack: any }) => {
		if (!checkId) {
			throw this.errorService.createBadRequestError("No check ID in request");
		}

		if (!teamId) {
			throw this.errorService.createBadRequestError("No team ID in request");
		}

		const updatedCheck = await this.db.checkModule.ackCheck(checkId, teamId, ack);
		return updatedCheck;
	};

	ackAllChecks = async ({ monitorId, path, teamId, ack }: { monitorId: string; path: string; teamId: string; ack: any }) => {
		if (path === "monitor") {
			if (!monitorId) {
				throw this.errorService.createBadRequestError("No monitor ID in request");
			}

			// For verificaiton, throws an error if monitor doesn't belong to team
			await this.monitorsRepository.findById(monitorId, teamId);
		}

		const updatedChecks = await this.db.checkModule.ackAllChecks(monitorId, teamId, ack, path);
		return updatedChecks;
	};

	deleteChecks = async ({ monitorId, teamId }: { monitorId: string; teamId: string }) => {
		if (!monitorId) {
			throw this.errorService.createBadRequestError("No monitor ID in request");
		}

		if (!teamId) {
			throw this.errorService.createBadRequestError("No team ID in request");
		}

		// For verificaiton, throws an error if monitor doesn't belong to team
		await this.monitorsRepository.findById(monitorId, teamId);

		const deletedCount = await this.db.checkModule.deleteChecks(monitorId);
		return deletedCount;
	};
	deleteChecksByTeamId = async ({ teamId }: { teamId: string }) => {
		if (!teamId) {
			throw this.errorService.createBadRequestError("No team ID in request");
		}

		const deletedCount = await this.db.checkModule.deleteChecksByTeamId(teamId);
		return deletedCount;
	};

	updateChecksTTL = async ({ teamId, ttl }: { teamId: string; ttl: string }) => {
		const SECONDS_PER_DAY = 86400;
		const newTTL = parseInt(ttl, 10) * SECONDS_PER_DAY;
		await this.db.checkModule.updateChecksTTL(teamId, newTTL);
	};
}

export default CheckService;
