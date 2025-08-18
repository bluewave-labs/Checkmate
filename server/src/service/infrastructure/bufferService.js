const SERVICE_NAME = "BufferService";

class BufferService {
	static SERVICE_NAME = SERVICE_NAME;
	constructor({ db, logger, envSettings }) {
		this.BUFFER_TIMEOUT = envSettings.nodeEnv === "development" ? 5000 : 1000 * 60 * 1; // 1 minute
		this.db = db;
		this.logger = logger;
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

	addToBuffer({ check }) {
		try {
			this.buffer.push(check);
		} catch (error) {
			this.logger.error({
				message: error.message,
				service: this.SERVICE_NAME,
				method: "addToBuffer",
				stack: error.stack,
			});
		}
	}

	scheduleNextFlush() {
		this.bufferTimer = setTimeout(async () => {
			try {
				await this.flushBuffer();
			} catch (error) {
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
		let items = this.buffer.length;

		try {
			await this.db.checkModule.createChecks(this.buffer);
		} catch (error) {
			this.logger.error({
				message: error.message,
				service: this.SERVICE_NAME,
				method: "flushBuffer",
				stack: error.stack,
			});
		}
		this.buffer = [];
		this.logger.debug({
			message: `Flushed ${items} items`,
			service: this.SERVICE_NAME,
			method: "flushBuffer",
		});
		items = 0;
	}
}

export default BufferService;
