import { config } from "@/config/index.js";
import type { Check } from "@/types/index.js";

const SERVICE_NAME = "BufferService";

class BufferService {
	static SERVICE_NAME = SERVICE_NAME;
	private BUFFER_TIMEOUT: number;
	private logger: any;
	private SERVICE_NAME: string;
	private buffer: any[];
	private bufferTimer: NodeJS.Timeout | null = null;
	private checksService: any;

	constructor({ logger, checkService }: { logger: any; checkService: any }) {
		this.BUFFER_TIMEOUT = config.NODE_ENV === "development" ? 10 : 1000 * 60 * 1; // 1 minute
		this.logger = logger;
		this.checksService = checkService;
		this.SERVICE_NAME = SERVICE_NAME;
		this.buffer = [];
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

	addToBuffer({ check }: { check: Check }) {
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
					check.monitorId?.toString() === checkToRemove.metadata.monitorId &&
					check.teamId?.toString() === checkToRemove.metadata.teamId &&
					check.type === checkToRemove.metadata.type &&
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
				await this.checksService.createChecks(this.buffer);
			}
		} catch (error: any) {
			this.logger.error({
				message: error.message,
				service: this.SERVICE_NAME,
				method: "flushBuffer",
				stack: error.stack,
			});
		}

		this.buffer = [];
	}
}

export default BufferService;
