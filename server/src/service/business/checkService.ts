import { Types } from "mongoose";
import { IChecksRepository, IMonitorsRepository } from "@/repositories/index.js";
import type { MonitorStatusResponse, CheckErrorInfo, Check } from "@/types/index.js";
import type { HardwareStatusPayload, PageSpeedStatusPayload } from "@/types/network.js";
import { AppError } from "@/utils/AppError.js";
import { ParseBoolean } from "@/utils/utils.js";
import { ILogger } from "@/utils/logger.js";

const SERVICE_NAME = "checkService";

class CheckService {
	static SERVICE_NAME = SERVICE_NAME;

	private monitorsRepository: IMonitorsRepository;
	private checksRepository: IChecksRepository;
	private logger: any;
	constructor(monitorsRepository: IMonitorsRepository, logger: ILogger, checksRepository: IChecksRepository) {
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
			id: new Types.ObjectId().toString(),
			createdAt: new Date().toISOString(),
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
			const { cpu, memory, disk, host, net } = hardwarePayload?.data ?? {};
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
		}
		return check;
	};

	getChecksByMonitor = async ({ monitorId, query, teamId }: { monitorId: string; query: any; teamId: string }) => {
		if (!monitorId) {
			throw new AppError({ message: "No monitor ID in request", service: SERVICE_NAME, method: "getChecksByMonitor", status: 400 });
		}
		if (!teamId) {
			throw new AppError({ message: "No team ID in request", service: SERVICE_NAME, method: "getChecksByMonitor", status: 400 });
		}

		// For verificaiton, throws an error if monitor doesn't belong to team
		await this.monitorsRepository.findById(monitorId, teamId);

		let { sortOrder, dateRange, filter, page, rowsPerPage, status } = query;
		const parsedStatus = typeof status === "undefined" ? status : ParseBoolean(status);
		const parsedPage = page ? parseInt(page) : page;
		const parsedRowsPerPage = rowsPerPage ? parseInt(rowsPerPage) : rowsPerPage;

		const result = await this.checksRepository.findByMonitorId(monitorId, sortOrder, dateRange, filter, parsedPage, parsedRowsPerPage, parsedStatus);

		return result;
	};

	getChecksByTeam = async ({ teamId, query }: { teamId: string; query: any }) => {
		let { sortOrder, dateRange, filter, page, rowsPerPage } = query;

		if (!teamId) {
			throw new AppError({ message: "No team ID in request", service: SERVICE_NAME, method: "getChecksByTeam", status: 400 });
		}

		const parsedPage = page ? parseInt(page) : page;
		const parsedRowsPerPage = rowsPerPage ? parseInt(rowsPerPage) : rowsPerPage;

		const checkData = await this.checksRepository.findByTeamId(sortOrder, dateRange, filter, parsedPage, parsedRowsPerPage, teamId);
		return checkData;
	};

	getChecksSummaryByTeamId = async ({ teamId, dateRange }: { teamId: string; dateRange: string }) => {
		if (!teamId) {
			throw new AppError({ message: "No team ID in request", service: SERVICE_NAME, method: "getChecksSummaryByTeamId", status: 400 });
		}
		const summary = await this.checksRepository.findSummaryByTeamId(teamId, dateRange);
		return summary;
	};

	deleteChecks = async ({ monitorId, teamId }: { monitorId: string; teamId: string }) => {
		if (!monitorId) {
			throw new AppError({ message: "No monitor ID in request", service: SERVICE_NAME, method: "deleteChecks", status: 400 });
		}

		if (!teamId) {
			throw new AppError({ message: "No team ID in request", service: SERVICE_NAME, method: "deleteChecks", status: 400 });
		}

		// For verificaiton, throws an error if monitor doesn't belong to team
		await this.monitorsRepository.findById(monitorId, teamId);

		const deletedCount = await this.checksRepository.deleteByMonitorId(monitorId);
		return deletedCount;
	};
	deleteChecksByTeamId = async ({ teamId }: { teamId: string }) => {
		if (!teamId) {
			throw new AppError({ message: "No team ID in request", service: SERVICE_NAME, method: "deleteChecksByTeamId", status: 400 });
		}

		const deletedCount = await this.checksRepository.deleteByTeamId(teamId);
		return deletedCount;
	};

	updateChecksTTL = async ({ teamId, ttl }: { teamId: string; ttl: string }) => {
		throw new AppError({ message: "Not implemented", service: SERVICE_NAME, method: "updateChecksTTL", status: 500 });
	};
}

export default CheckService;
