import type { Check } from "@/types/index.js";
import type { GeoCheck } from "@/types/index.js";
import type { IGeoChecksService } from "../business/geoChecksService.js";
import type { ILogger } from "@/utils/logger.js";
import type { ISettingsService } from "@/service/system/settingsService.js";
const SERVICE_NAME = "BufferService";

export interface IBufferService {
	addToBuffer(check: Check): void;
	addGeoCheckToBuffer(geoCheck: GeoCheck): void;
	removeCheckFromBuffer(check: Check): boolean;
	scheduleNextFlush(): void;
	flushBuffer(): Promise<void>;
	flushGeoBuffer(): Promise<void>;
}

class BufferService implements IBufferService {
	static SERVICE_NAME = SERVICE_NAME;
	private BUFFER_TIMEOUT: number;
	private logger: ILogger;
	private SERVICE_NAME: string;
	private buffer: any[];
	private geoBuffer: any[];
	private bufferTimer: NodeJS.Timeout | null = null;
	private checksService: any;
	private geoChecksService: IGeoChecksService;

	constructor(logger: ILogger, checkService: any, geoChecksService: IGeoChecksService, settingsService: ISettingsService) {
		this.BUFFER_TIMEOUT = settingsService.getSettings().nodeEnv === "development" ? 10 : 1000 * 60 * 1; // 1 minute
		this.logger = logger;
		this.checksService = checkService;
		this.geoChecksService = geoChecksService;
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
		} catch (error: any) {
			this.logger.error({
				message: error.message,
				service: this.SERVICE_NAME,
				method: "addToBuffer",
				stack: error.stack,
			});
		}
	}

	addGeoCheckToBuffer(geoCheck: GeoCheck) {
		try {
			this.geoBuffer.push(geoCheck);
		} catch (error: any) {
			this.logger.error({
				message: error.message,
				service: this.SERVICE_NAME,
				method: "addGeoCheckToBuffer",
				stack: error.stack,
			});
		}
	}

	removeCheckFromBuffer(checkToRemove: Check) {
		try {
			if (!checkToRemove) {
				return false;
			}

			const index = this.buffer.findIndex((check) => {
				if (checkToRemove.id && check.id) {
					return check.id.toString() === checkToRemove.id.toString();
				}
				return (
					check.metadata.monitorId?.toString() === checkToRemove.metadata.monitorId &&
					check.metadata.teamId?.toString() === checkToRemove.metadata.teamId &&
					check.metadata.type === checkToRemove.metadata.type &&
					check.status === checkToRemove.status &&
					check.statusCode === checkToRemove.statusCode &&
					check.responseTime === checkToRemove.responseTime &&
					check.message === checkToRemove.message
				);
			});

			if (index !== -1) {
				this.buffer.splice(index, 1);
				return true;
			}

			return false;
		} catch (error: any) {
			this.logger.error({
				message: error.message,
				service: this.SERVICE_NAME,
				method: "removeCheckFromBuffer",
				stack: error.stack,
			});
			return false;
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
			} catch (error: any) {
				this.logger.error({
					message: `Error in flush cycle: ${error.message}`,
					service: this.SERVICE_NAME,
					method: "scheduleNextFlush",
					stack: error.stack,
				});
			} finally {
				// Schedule the next flush only after the current one completes
				this.scheduleNextFlush();
			}
		}, this.BUFFER_TIMEOUT);
	}
	async flushBuffer() {
		try {
			if (this.buffer.length > 0) {
				this.logger.debug({
					message: `Flushing ${this.buffer.length} checks to database`,
					service: this.SERVICE_NAME,
					method: "flushBuffer",
				});
				await this.checksService.createChecks(this.buffer);
				this.buffer = [];
			}
		} catch (error: any) {
			this.logger.error({
				message: `Error flushing checks buffer: ${error.message}`,
				service: this.SERVICE_NAME,
				method: "flushBuffer",
				stack: error.stack,
			});
			// Clear buffer even on error to prevent infinite retry loops
			this.buffer = [];
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
		} catch (error: any) {
			this.logger.error({
				message: `Error flushing geo checks buffer: ${error.message}`,
				service: this.SERVICE_NAME,
				method: "flushGeoBuffer",
				stack: error.stack,
			});
			// Clear buffer even on error to prevent infinite retry loops
			this.geoBuffer = [];
		}
	}
}

export default BufferService;
