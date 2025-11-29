const SERVICE_NAME = "BufferService";

class BufferService {
	static SERVICE_NAME = SERVICE_NAME;
	constructor({ db, logger, envSettings, incidentService }) {
		this.BUFFER_TIMEOUT = envSettings.nodeEnv === "development" ? 1000 : 1000 * 60 * 1; // 1 minute
		this.db = db;
		this.logger = logger;
		this.incidentService = incidentService;
		this.SERVICE_NAME = SERVICE_NAME;
		this.buffer = [];
		this.incidentBuffer = [];
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

	addIncidentToBuffer({ monitor, check, action = "create" }) {
		try {
			if (!monitor || !check) {
				this.logger.warn({
					message: "Skipping incident buffer item: missing monitor or check",
					service: this.SERVICE_NAME,
					method: "addIncidentToBuffer",
				});
				return;
			}

			this.incidentBuffer.push({ monitor, check, action });
		} catch (error) {
			this.logger.error({
				message: error.message,
				service: this.SERVICE_NAME,
				method: "addIncidentToBuffer",
				stack: error.stack,
			});
		}
	}

	removeCheckFromBuffer(checkToRemove) {
		try {
			if (!checkToRemove) {
				return false;
			}

			const index = this.buffer.findIndex((check) => {
				if (checkToRemove._id && check._id) {
					return check._id.toString() === checkToRemove._id.toString();
				}
				return (
					check.monitorId?.toString() === checkToRemove.monitorId?.toString() &&
					check.teamId?.toString() === checkToRemove.teamId?.toString() &&
					check.type === checkToRemove.type &&
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
		} catch (error) {
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
		try {
			if (this.buffer.length > 0) {
				await this.db.checkModule.createChecks(this.buffer);
			}
		} catch (error) {
			this.logger.error({
				message: error.message,
				service: this.SERVICE_NAME,
				method: "flushBuffer",
				stack: error.stack,
			});
		}

		try {
			if (this.incidentBuffer.length > 0 && this.incidentService) {
				await this.flushIncidentBuffer();
			}
		} catch (error) {
			this.logger.error({
				message: error.message,
				service: this.SERVICE_NAME,
				method: "flushBuffer",
				stack: error.stack,
			});
		}

		this.buffer = [];
		this.incidentBuffer = [];
	}

	async flushIncidentBuffer() {
		if (!this.incidentService || this.incidentBuffer.length === 0) {
			return;
		}

		try {
			const itemsToProcess = [...this.incidentBuffer];
			await this.incidentService.processIncidentsFromBuffer(itemsToProcess);
		} catch (error) {
			this.logger.error({
				message: `Error flushing incident buffer: ${error.message}`,
				service: this.SERVICE_NAME,
				method: "flushIncidentBuffer",
				stack: error.stack,
			});
			throw error;
		}
	}
}

export default BufferService;
