import { Types } from "mongoose";
import { IChecksRepository } from "@/domain/checks/check.repository.interface.js";
import { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";
import type { Check, CheckErrorInfo, ChecksQueryResult, ChecksSummary, ILighthouseAudit } from "@/domain/checks/check.type.js";
import type { MonitorPayloadMap, MonitorStatusResponse } from "@/types/network.js";
import type { HardwareStatusPayload, PageSpeedStatusPayload } from "@/types/network.js";
import { AppError } from "@/utils/AppError.js";
import { ILogger } from "@/utils/logger.js";

const SERVICE_NAME = "checkService";

export interface ICheckService {
	createChecks(checks: Check[]): Promise<Check[]>;
	toCheck(statusResponse: MonitorStatusResponse<MonitorPayloadMap[keyof MonitorPayloadMap]>): Check | undefined;
	toStatusResponse(check: Check): MonitorStatusResponse<MonitorPayloadMap[keyof MonitorPayloadMap]>;
	getChecksByMonitor(params: {
		monitorId: string;
		teamId: string;
		sortOrder: string;
		dateRange: string;
		page: number;
		rowsPerPage: number;
		filter?: string;
		status?: boolean;
	}): Promise<ChecksQueryResult>;
	getChecksByTeam(params: {
		teamId: string;
		sortOrder: string;
		dateRange: string;
		page: number;
		rowsPerPage: number;
		filter?: string;
	}): Promise<ChecksQueryResult>;
	getChecksSummaryByTeamId(params: { teamId: string; dateRange: string }): Promise<ChecksSummary>;
	deleteChecks(params: { monitorId: string; teamId: string }): Promise<number>;
	deleteChecksByTeamId(params: { teamId: string }): Promise<number>;
	deleteOlderThan(date: Date): Promise<number>;
}

export class CheckService implements ICheckService {
	static SERVICE_NAME = SERVICE_NAME;

	private monitorsRepository: IMonitorsRepository;
	private checksRepository: IChecksRepository;
	private logger: ILogger;
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

	toCheck = (statusResponse: MonitorStatusResponse<MonitorPayloadMap[keyof MonitorPayloadMap]>): Check | undefined => {
		const { monitorId, teamId, type, status, responseTime, code, message, payload, timings } = statusResponse;

		const now = new Date().toISOString();
		const check: Check = {
			id: new Types.ObjectId().toString(),
			createdAt: now,
			updatedAt: now,
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
					method: "toCheck",
				});
				return undefined;
			}
			const categories = pageSpeedPayload.lighthouseResult?.categories ?? {};
			const audits = pageSpeedPayload.lighthouseResult?.audits ?? {};
			const mapAudit = (audit: ILighthouseAudit | undefined) => {
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
			check.accessibility = (categories.accessibility?.score || 0) * 100;
			check.bestPractices = (categories["best-practices"]?.score || 0) * 100;
			check.seo = (categories.seo?.score || 0) * 100;
			check.performance = (categories.performance?.score || 0) * 100;
			check.audits = {
				cls: mapAudit(audits["cumulative-layout-shift"]),
				si: mapAudit(audits["speed-index"]),
				fcp: mapAudit(audits["first-contentful-paint"]),
				lcp: mapAudit(audits["largest-contentful-paint"]),
				tbt: mapAudit(audits["total-blocking-time"]),
			};
		}

		if (type === "hardware") {
			const hardwarePayload = payload as HardwareStatusPayload | undefined;
			const { cpu, memory, disk, host, net } = hardwarePayload?.data ?? {};
			const errorsSource = Array.isArray(hardwarePayload?.errors)
				? hardwarePayload.errors
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

	toStatusResponse = (check: Check) => {
		const statusResponse: MonitorStatusResponse<MonitorPayloadMap[keyof MonitorPayloadMap]> = {
			monitorId: check.metadata.monitorId,
			teamId: check.metadata.teamId,
			type: check.metadata.type,
			status: check.status,
			code: check.statusCode,
			message: check.message,
			responseTime: check.responseTime,
			// re-nest hardware metrics so updateMonitorStatus / extractThresholdBreaches see payload.data
			payload:
				check.metadata.type === "hardware"
					? ({ data: { cpu: check.cpu, memory: check.memory, disk: check.disk, host: check.host, net: check.net } } as HardwareStatusPayload)
					: undefined,
		};
		return statusResponse;
	};

	getChecksByMonitor = async ({
		monitorId,
		teamId,
		sortOrder,
		dateRange,
		filter,
		page,
		rowsPerPage,
		status,
	}: {
		monitorId: string;
		teamId: string;
		sortOrder: string;
		dateRange: string;
		page: number;
		rowsPerPage: number;
		status?: boolean;
		filter?: string;
	}) => {
		if (!monitorId) {
			throw new AppError({ message: "No monitor ID in request", service: SERVICE_NAME, method: "getChecksByMonitor", status: 400 });
		}
		if (!teamId) {
			throw new AppError({ message: "No team ID in request", service: SERVICE_NAME, method: "getChecksByMonitor", status: 400 });
		}

		// For verification, throws an error if monitor doesn't belong to team
		await this.monitorsRepository.findById(monitorId, teamId);

		const parsedPage = page ?? 0;
		const parsedRowsPerPage = rowsPerPage ?? 5;

		const result = await this.checksRepository.findByMonitorId(monitorId, sortOrder, dateRange, filter, parsedPage, parsedRowsPerPage, status);

		return result;
	};

	getChecksByTeam = async ({
		teamId,
		sortOrder,
		dateRange,
		filter,
		page,
		rowsPerPage,
	}: {
		teamId: string;
		sortOrder: string;
		dateRange: string;
		page: number;
		rowsPerPage: number;
		filter?: string;
	}) => {
		const parsedPage = page ?? 0;
		const parsedRowsPerPage = rowsPerPage ?? 5;

		const checkData = await this.checksRepository.findByTeamId(sortOrder, dateRange, filter, parsedPage, parsedRowsPerPage, teamId);
		return checkData;
	};

	getChecksSummaryByTeamId = async ({ teamId, dateRange }: { teamId: string; dateRange: string }) => {
		const summary = await this.checksRepository.findSummaryByTeamId(teamId, dateRange);
		return summary;
	};

	deleteChecks = async ({ monitorId, teamId }: { monitorId: string; teamId: string }) => {
		await this.monitorsRepository.findById(monitorId, teamId);

		const deletedCount = await this.checksRepository.deleteByMonitorId(monitorId);
		return deletedCount;
	};
	deleteChecksByTeamId = async ({ teamId }: { teamId: string }) => {
		const deletedCount = await this.checksRepository.deleteByTeamId(teamId);
		return deletedCount;
	};

	deleteOlderThan = async (date: Date) => {
		const deletedCount = await this.checksRepository.deleteOlderThan(date);
		return deletedCount;
	};
}
