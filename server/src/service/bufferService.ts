import type { Check } from "@/domain/checks/check.type.js";
import type { GeoCheck } from "@/domain/geo-checks/geo-check.type.js";
import type { IGeoChecksService } from "../domain/geo-checks/geo-check.service.js";
import type { ILogger } from "@/utils/logger/logger.js";
import type { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import { DockerLog } from "@/domain/docker/docker-log.type.js";
import { IDockerLogsService } from "@/domain/docker/docker-log.service.js";
const SERVICE_NAME = "BufferService";

export type CheckIngest = (checks: Check[]) => Promise<void>;
export interface IBufferService {
	addToBuffer(check: Check): void;
	addGeoCheckToBuffer(geoCheck: GeoCheck): void;
	addDockerLogToBuffer(dockerLog: DockerLog): void;
	scheduleNextFlush(): void;
	flushBuffer(): Promise<void>;
	flushGeoBuffer(): Promise<void>;
	flushDockerLogsBuffer(): Promise<void>;
	shutdown(): Promise<void>;
}

export class BufferService implements IBufferService {
	static SERVICE_NAME = SERVICE_NAME;
	private BUFFER_TIMEOUT: number;
	private logger: ILogger;
	private buffer: Check[];
	private geoBuffer: GeoCheck[];
	private dockerLogBuffer: DockerLog[];
	private bufferTimer: NodeJS.Timeout | null = null;
	private geoChecksService: IGeoChecksService;
	private dockerLogsService: IDockerLogsService;

	constructor(
		logger: ILogger,
		geoChecksService: IGeoChecksService,
		dockerLogsService: IDockerLogsService,
		settingsService: ISettingsService,
		private ingest: CheckIngest
	) {
		this.BUFFER_TIMEOUT = settingsService.getSettings().nodeEnv === "development" ? 1000 : 1000 * 60 * 1; // 1 minute
		this.logger = logger.child({ service: SERVICE_NAME });
		this.geoChecksService = geoChecksService;
		this.dockerLogsService = dockerLogsService;
		this.buffer = [];
		this.geoBuffer = [];
		this.dockerLogBuffer = [];
		this.scheduleNextFlush();
		this.logger.info({ flushIntervalSeconds: this.BUFFER_TIMEOUT / 1000 }, "Buffer service initialized");
	}

	addToBuffer(check: Check) {
		this.buffer.push(check);
	}

	addGeoCheckToBuffer(geoCheck: GeoCheck) {
		this.geoBuffer.push(geoCheck);
	}

	addDockerLogToBuffer(dockerLog: DockerLog): void {
		this.dockerLogBuffer.push(dockerLog);
	}

	scheduleNextFlush() {
		if (this.bufferTimer) {
			clearTimeout(this.bufferTimer);
		}
		this.bufferTimer = setTimeout(async () => {
			try {
				await this.flushBuffer();
				await this.flushGeoBuffer();
				await this.flushDockerLogsBuffer();
			} catch (error: unknown) {
				this.logger.error({ err: error }, "Scheduled buffer flush failed");
			} finally {
				// Schedule the next flush only after the current one completes
				this.scheduleNextFlush();
			}
		}, this.BUFFER_TIMEOUT);
	}

	async flushBuffer() {
		// Take the batch first so a write that drains it can't be appended to mid-flush
		const batch = this.buffer;
		this.buffer = [];
		try {
			if (batch.length > 0) {
				this.logger.debug({ count: batch.length }, "Flushing checks to database");
			}
			await this.ingest(batch);
		} catch (error: unknown) {
			this.logger.error({ err: error }, "Failed to flush checks to database");
			// Batch is already cleared from the buffer; dropping it prevents infinite retry loops
		}
	}

	async flushGeoBuffer() {
		try {
			if (this.geoBuffer.length > 0) {
				this.logger.debug({ count: this.geoBuffer.length }, "Flushing geo checks to database");
				await this.geoChecksService.createGeoChecks(this.geoBuffer);
				this.geoBuffer = [];
			}
		} catch (error: unknown) {
			this.logger.error({ err: error }, "Failed to flush geo checks to database");
			// Clear buffer even on error to prevent infinite retry loops
			this.geoBuffer = [];
		}
	}

	async flushDockerLogsBuffer() {
		if (this.dockerLogBuffer.length === 0) {
			return;
		}
		// Take the batch first so a write that drains it can't be appended to mid-flush
		const batch = this.dockerLogBuffer;
		this.dockerLogBuffer = [];
		try {
			this.logger.debug({ count: batch.length }, "Flushing docker logs to database");
			await this.dockerLogsService.createDockerLogs(batch);
		} catch (error: unknown) {
			this.logger.error({ err: error }, "Failed to flush docker logs to database");
		}
	}

	async shutdown() {
		if (this.bufferTimer) {
			clearTimeout(this.bufferTimer);
			this.bufferTimer = null;
		}
		await this.flushBuffer();
		await this.flushGeoBuffer();
		await this.flushDockerLogsBuffer();
	}
}
