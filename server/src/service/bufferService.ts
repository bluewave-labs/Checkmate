import type { Check } from "@/domain/checks/check.type.js";
import type { GeoCheck } from "@/domain/geo-checks/geo-check.type.js";
import type { IGeoChecksService } from "../domain/geo-checks/geo-check.service.js";
import type { ILogger } from "@/utils/logger.js";
import type { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import type { IJobsRepository } from "@/domain/jobs/job.repository.interface.js";
import { ICheckService } from "../domain/checks/check.service.js";
const SERVICE_NAME = "BufferService";

export interface IBufferService {
	addToBuffer(check: Check): void;
	addGeoCheckToBuffer(geoCheck: GeoCheck): void;
	scheduleNextFlush(): void;
	flushBuffer(): Promise<void>;
	flushGeoBuffer(): Promise<void>;
	shutdown(): Promise<void>;
}

export class BufferService implements IBufferService {
	static SERVICE_NAME = SERVICE_NAME;
	private BUFFER_TIMEOUT: number;
	private logger: ILogger;
	private SERVICE_NAME: string;
	private buffer: Check[];
	private geoBuffer: GeoCheck[];
	private bufferTimer: NodeJS.Timeout | null = null;
	private checksService: ICheckService;
	private geoChecksService: IGeoChecksService;
	private jobsRepository: IJobsRepository;

	constructor(
		logger: ILogger,
		checkService: ICheckService,
		geoChecksService: IGeoChecksService,
		settingsService: ISettingsService,
		jobsRepository: IJobsRepository
	) {
		this.BUFFER_TIMEOUT = settingsService.getSettings().nodeEnv === "development" ? 1000 : 1000 * 60 * 1; // 1 minute
		this.logger = logger;
		this.checksService = checkService;
		this.geoChecksService = geoChecksService;
		this.jobsRepository = jobsRepository;
		this.SERVICE_NAME = SERVICE_NAME;
		this.buffer = [];
		this.geoBuffer = [];
		this.scheduleNextFlush();
		this.logger.info({
			message: `Buffer service initialized, flushing every ${this.BUFFER_TIMEOUT / 1000}s`,
			service: this.SERVICE_NAME,
			method: "constructor",
		});
	}

	get serviceName() {
		return BufferService.SERVICE_NAME;
	}

	addToBuffer(check: Check) {
		try {
			this.buffer.push(check);
		} catch (error: unknown) {
			this.logger.error({
				message: error instanceof Error ? error.message : "Unknown error",
				service: this.SERVICE_NAME,
				method: "addToBuffer",
				stack: error instanceof Error ? error.stack : undefined,
			});
		}
	}

	addGeoCheckToBuffer(geoCheck: GeoCheck) {
		try {
			this.geoBuffer.push(geoCheck);
		} catch (error: unknown) {
			this.logger.error({
				message: error instanceof Error ? error.message : "Unknown error",
				service: this.SERVICE_NAME,
				method: "addGeoCheckToBuffer",
				stack: error instanceof Error ? error.stack : undefined,
			});
		}
	}

	scheduleNextFlush() {
		if (this.bufferTimer) {
			clearTimeout(this.bufferTimer);
		}
		this.bufferTimer = setTimeout(async () => {
			try {
				await this.flushBuffer();
				await this.flushGeoBuffer();
			} catch (error: unknown) {
				this.logger.error({
					message: error instanceof Error ? error.message : "Unknown error",
					service: this.SERVICE_NAME,
					method: "scheduleNextFlush",
					stack: error instanceof Error ? error.stack : undefined,
				});
			} finally {
				// Schedule the next flush only after the current one completes
				this.scheduleNextFlush();
			}
		}, this.BUFFER_TIMEOUT);
	}
	async flushBuffer() {
		if (this.buffer.length === 0) {
			return;
		}
		// Take the batch first so a write that drains it can't be appended to mid-flush
		const batch = this.buffer;
		this.buffer = [];
		try {
			this.logger.debug({
				message: `Flushing ${batch.length} checks to database`,
				service: this.SERVICE_NAME,
				method: "flushBuffer",
			});
			await this.checksService.createChecks(batch);
			// Need to evaluate checks when they are flushed
			const monitorIds = [...new Set(batch.map((check) => check.metadata.monitorId))];
			const now = Date.now();
			await Promise.all(monitorIds.map((monitorId) => this.jobsRepository.upsertEvaluate(monitorId, now)));
		} catch (error: unknown) {
			this.logger.error({
				message: error instanceof Error ? error.message : "Unknown error",
				service: this.SERVICE_NAME,
				method: "flushBuffer",
				stack: error instanceof Error ? error.stack : undefined,
			});
			// Batch is already cleared from the buffer; dropping it prevents infinite retry loops
		}
	}

	async flushGeoBuffer() {
		try {
			if (this.geoBuffer.length > 0) {
				this.logger.debug({
					message: `Flushing ${this.geoBuffer.length} geo checks to database`,
					service: this.SERVICE_NAME,
					method: "flushGeoBuffer",
				});
				await this.geoChecksService.createGeoChecks(this.geoBuffer);
				this.geoBuffer = [];
			}
		} catch (error: unknown) {
			this.logger.error({
				message: error instanceof Error ? error.message : "Unknown error",
				service: this.SERVICE_NAME,
				method: "flushGeoBuffer",
				stack: error instanceof Error ? error.stack : undefined,
			});
			// Clear buffer even on error to prevent infinite retry loops
			this.geoBuffer = [];
		}
	}

	async shutdown() {
		if (this.bufferTimer) {
			clearTimeout(this.bufferTimer);
			this.bufferTimer = null;
		}
		await this.flushBuffer();
		await this.flushGeoBuffer();
	}
}
