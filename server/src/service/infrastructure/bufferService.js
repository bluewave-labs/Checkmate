const SERVICE_NAME = "BufferService";
const TYPE_MAP = {
	http: "checks",
	ping: "checks",
	port: "checks",
	docker: "checks",
	pagespeed: "pagespeedChecks",
	hardware: "hardwareChecks",
};

class BufferService {
	static SERVICE_NAME = SERVICE_NAME;
	constructor({ db, logger, envSettings }) {
		this.BUFFER_TIMEOUT = envSettings.nodeEnv === "development" ? 5000 : 1000 * 60 * 1; // 1 minute
		this.db = db;
		this.logger = logger;
		this.SERVICE_NAME = SERVICE_NAME;
		this.buffers = {
			checks: [],
			pagespeedChecks: [],
			hardwareChecks: [],
		};
		this.OPERATION_MAP = {
			checks: this.db.checkModule.createChecks,
			pagespeedChecks: this.db.createPageSpeedChecks,
			hardwareChecks: this.db.createHardwareChecks,
		};

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

	addToBuffer({ check, type }) {
		try {
			this.buffers[TYPE_MAP[type]].push(check);
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
				await this.flushBuffers();
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
	async flushBuffers() {
		let items = 0;
		for (const [bufferName, buffer] of Object.entries(this.buffers)) {
			items += buffer.length;
			const operation = this.OPERATION_MAP[bufferName];
			if (!operation) {
				this.logger.error({
					message: `No operation found for ${bufferName}`,
					service: this.SERVICE_NAME,
					method: "flushBuffers",
				});
				continue;
			}
			try {
				await operation(buffer);
			} catch (error) {
				this.logger.error({
					message: error.message,
					service: this.SERVICE_NAME,
					method: "flushBuffers",
					stack: error.stack,
				});
			}
			this.buffers[bufferName] = [];
		}
		this.logger.debug({
			message: `Flushed ${items} items`,
			service: this.SERVICE_NAME,
			method: "flushBuffers",
		});
		items = 0;
	}
}

export default BufferService;
