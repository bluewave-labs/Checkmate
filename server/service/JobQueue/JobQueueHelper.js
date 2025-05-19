const SERVICE_NAME = "JobQueueHelper";

class JobQueueHelper {
	constructor({
		redisService,
		Queue,
		Worker,
		logger,
		db,
		networkService,
		statusService,
		notificationService,
	}) {
		this.db = db;
		this.redisService = redisService;
		this.Queue = Queue;
		this.Worker = Worker;
		this.logger = logger;
		this.networkService = networkService;
		this.statusService = statusService;
		this.notificationService = notificationService;
	}

	createQueue(queueName) {
		const connection = this.redisService.getNewConnection();
		const q = new this.Queue(queueName, {
			connection,
		});
		q.lastJobProcessedTime = Date.now();
		q.on("cleaned", (jobs, type) => {
			this.logger.debug({
				message: `Queue ${queueName} is cleaned with jobs: ${jobs} and type: ${type}`,
				service: SERVICE_NAME,
				method: "createQueue:cleaned",
			});
		});
		q.on("error", (err) => {
			this.logger.error({
				message: `Queue ${queueName} is error with msg: ${err}`,
				service: SERVICE_NAME,
				method: "createQueue:error",
			});
		});
		q.on("ioredis:close", () => {
			this.logger.debug({
				message: `Queue ${queueName} is ioredis:close`,
				service: SERVICE_NAME,
				method: "createQueue:ioredis:close",
			});
		});
		q.on("paused", () => {
			this.logger.debug({
				message: `Queue ${queueName} is paused`,
				service: SERVICE_NAME,
				method: "createQueue:paused",
			});
		});
		q.on("progress", (job, progress) => {
			this.logger.debug({
				message: `Queue ${queueName} is progress with msg: ${progress}`,
				service: SERVICE_NAME,
				method: "createQueue:progress",
			});
		});
		q.on("removed", (job) => {
			this.logger.debug({
				message: `Queue ${queueName} is removed with msg: ${job}`,
				service: SERVICE_NAME,
				method: "createQueue:removed",
			});
		});
		q.on("resumed", () => {
			this.logger.debug({
				message: `Queue ${queueName} is resumed`,
				service: SERVICE_NAME,
				method: "createQueue:resumed",
			});
		});
		q.on("waiting", () => {
			this.logger.debug({
				message: `Queue ${queueName} is waiting`,
				service: SERVICE_NAME,
				method: "createQueue:waiting",
			});
		});
		return q;
	}

	createWorker(queueName, queue) {
		const connection = this.redisService.getNewConnection({
			maxRetriesPerRequest: null,
		});
		const worker = new this.Worker(queueName, this.createJobHandler(queue), {
			connection,
			concurrency: 50,
		});
		worker.on("active", (job) => {
			this.logger.debug({
				message: `Worker ${queueName} is active`,
				service: SERVICE_NAME,
				method: "createWorker:active",
			});
		});

		worker.on("closed", () => {
			this.logger.debug({
				message: `Worker ${queueName} is closed`,
				service: SERVICE_NAME,
				method: "createWorker:closed",
			});
		});

		worker.on("closing", (msg) => {
			this.logger.debug({
				message: `Worker ${queueName} is closing with msg: ${msg}`,
				service: SERVICE_NAME,
				method: "createWorker:closing",
			});
		});

		worker.on("completed", (job) => {
			this.logger.debug({
				message: `Worker ${queueName} is completed`,
				service: SERVICE_NAME,
				method: "createWorker:completed",
			});
		});

		worker.on("drained", () => {
			this.logger.debug({
				message: `Worker ${queueName} is drained`,
				service: SERVICE_NAME,
				method: "createWorker:drained",
			});
		});

		worker.on("error", (failedReason) => {
			this.logger.error({
				message: `Worker ${queueName} is error with msg: ${failedReason}`,
				service: SERVICE_NAME,
				method: "createWorker:error",
			});
		});

		worker.on("failed", (job, error, prev) => {
			this.logger.warn({
				message: `Worker ${queueName} is failed with msg: ${error}`,
				service: SERVICE_NAME,
				method: "createWorker:failed",
			});
		});

		worker.on("ioredis:close", () => {
			this.logger.debug({
				message: `Worker ${queueName} is ioredis:close`,
				service: SERVICE_NAME,
				method: "createWorker:ioredis:close",
			});
		});

		worker.on("paused", () => {
			this.logger.debug({
				message: `Worker ${queueName} is paused`,
				service: SERVICE_NAME,
				method: "createWorker:paused",
			});
		});

		worker.on("progress", (job, progress) => {
			this.logger.debug({
				message: `Worker ${queueName} is progress with msg: ${progress}`,
				service: SERVICE_NAME,
				method: "createWorker:progress",
			});
		});

		worker.on("ready", () => {
			this.logger.debug({
				message: `Worker ${queueName} is ready`,
				service: SERVICE_NAME,
				method: "createWorker:ready",
			});
		});

		worker.on("resumed", () => {
			this.logger.debug({
				message: `Worker ${queueName} is resumed`,
				service: SERVICE_NAME,
				method: "createWorker:resumed",
			});
		});

		worker.on("stalled", () => {
			this.logger.warn({
				message: `Worker ${queueName} is stalled`,
				service: SERVICE_NAME,
				method: "createWorker:stalled",
			});
		});
		return worker;
	}

	async isInMaintenanceWindow(monitorId) {
		const maintenanceWindows = await this.db.getMaintenanceWindowsByMonitorId(monitorId);
		// Check for active maintenance window:
		const maintenanceWindowIsActive = maintenanceWindows.reduce((acc, window) => {
			if (window.active) {
				const start = new Date(window.start);
				const end = new Date(window.end);
				const now = new Date();
				const repeatInterval = window.repeat || 0;

				// If start is < now and end > now, we're in maintenance
				if (start <= now && end >= now) return true;

				// If maintenance window was set in the past with a repeat,
				// we need to advance start and end to see if we are in range

				while (start < now && repeatInterval !== 0) {
					start.setTime(start.getTime() + repeatInterval);
					end.setTime(end.getTime() + repeatInterval);
					if (start <= now && end >= now) {
						return true;
					}
				}
				return false;
			}
			return acc;
		}, false);
		return maintenanceWindowIsActive;
	}

	createJobHandler(q) {
		return async (job) => {
			try {
				// Update the last job processed time for this queue
				q.lastJobProcessedTime = Date.now();
				// Get all maintenance windows for this monitor
				await job.updateProgress(0);
				const monitorId = job.data._id;
				const maintenanceWindowActive = await this.isInMaintenanceWindow(monitorId);
				// If a maintenance window is active, we're done

				if (maintenanceWindowActive) {
					await job.updateProgress(100);
					this.logger.info({
						message: `Monitor ${monitorId} is in maintenance window`,
						service: SERVICE_NAME,
						method: "createWorker",
					});
					return false;
				}

				// Get the current status
				await job.updateProgress(30);
				const networkResponse = await this.networkService.getStatus(job);
				if (
					job.data.type === "distributed_http" ||
					job.data.type === "distributed_test"
				) {
					await job.updateProgress(100);
					return true;
				}

				// If the network response is not found, we're done
				if (!networkResponse) {
					await job.updateProgress(100);
					return false;
				}

				// Handle status change
				await job.updateProgress(60);
				const { monitor, statusChanged, prevStatus } =
					await this.statusService.updateStatus(networkResponse);
				// Handle notifications
				await job.updateProgress(80);
				this.notificationService
					.handleNotifications({
						...networkResponse,
						monitor,
						prevStatus,
						statusChanged,
					})
					.catch((error) => {
						this.logger.error({
							message: error.message,
							service: SERVICE_NAME,
							method: "createJobHandler",
							details: `Error sending notifications for job ${job.id}: ${error.message}`,
							stack: error.stack,
						});
					});
				await job.updateProgress(100);
				return true;
			} catch (error) {
				this.logger.error({
					message: error.message,
					service: error.service ?? SERVICE_NAME,
					method: error.method ?? "createJobHandler",
					details: `Error processing job ${job.id}: ${error.message}`,
					stack: error.stack,
				});
				throw error;
			}
		};
	}
	async flushRedis() {
		try {
			const connection = this.redisService.getNewConnection();
			const flushResult = await connection.flushall();
			return flushResult;
		} catch (error) {
			this.logger.warn({
				message: error.message,
				service: SERVICE_NAME,
				method: "flushRedis",
			});
			return false;
		}
	}
}

export default JobQueueHelper;
