const QUEUE_NAMES = ["uptime", "pagespeed", "hardware", "distributed"];
const SERVICE_NAME = "JobQueue";
const HEALTH_CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes
const QUEUE_LOOKUP = {
	hardware: "hardware",
	http: "uptime",
	ping: "uptime",
	port: "uptime",
	docker: "uptime",
	pagespeed: "pagespeed",
	distributed_http: "distributed",
};
const getSchedulerId = (monitor) => `scheduler:${monitor.type}:${monitor._id}`;

class JobQueue {
	static SERVICE_NAME = SERVICE_NAME;

	constructor({ db, jobQueueHelper, logger, stringService }) {
		this.db = db;
		this.jobQueueHelper = jobQueueHelper;
		this.stringService = stringService;
		this.logger = logger;
		this.queues = {};
		this.workers = [];
	}

	static async create({ db, jobQueueHelper, logger, stringService }) {
		const instance = new JobQueue({ db, jobQueueHelper, logger, stringService });
		await instance.init();
		return instance;
	}

	async init() {
		try {
			await this.initQueues();
			await this.initWorkers();
			const monitors = await this.db.getAllMonitors();
			await Promise.all(
				monitors
					.filter((monitor) => monitor.isActive)
					.map(async (monitor) => {
						try {
							await this.addJob(monitor._id, monitor);
						} catch (error) {
							this.logger.error({
								message: error.message,
								service: SERVICE_NAME,
								method: "initJobQueue",
								stack: error.stack,
							});
						}
					})
			);
			this.healthCheckInterval = setInterval(async () => {
				try {
					const queueHealthChecks = await this.checkQueueHealth();
					const queueIsStuck = queueHealthChecks.some((healthCheck) => healthCheck.stuck);
					if (queueIsStuck) {
						this.logger.warn({
							message: "Queue is stuck",
							service: SERVICE_NAME,
							method: "periodicHealthCheck",
							details: queueHealthChecks,
						});
						await this.flushQueues();
					}
				} catch (error) {
					this.logger.error({
						message: error.message,
						service: SERVICE_NAME,
						method: "periodicHealthCheck",
						stack: error.stack,
					});
				}
			}, HEALTH_CHECK_INTERVAL);
		} catch (error) {
			this.logger.error({
				message: error.message,
				service: SERVICE_NAME,
				method: "initJobQueue",
				stack: error.stack,
			});
		}
	}

	async initQueues() {
		const readyPromises = [];

		for (const queueName of QUEUE_NAMES) {
			const q = this.jobQueueHelper.createQueue(queueName);
			this.queues[queueName] = q;
			readyPromises.push(q.waitUntilReady());
		}
		await Promise.all(readyPromises);
		this.logger.info({
			message: "Queues ready",
			service: SERVICE_NAME,
			method: "initQueues",
		});
	}

	async initWorkers() {
		const workerReadyPromises = [];

		for (const queueName of QUEUE_NAMES) {
			const worker = this.jobQueueHelper.createWorker(queueName, this.queues[queueName]);
			this.workers.push(worker);
			workerReadyPromises.push(worker.waitUntilReady());
		}
		await Promise.all(workerReadyPromises);
		this.logger.info({
			message: "Workers ready",
			service: SERVICE_NAME,
			method: "initWorkers",
		});
	}

	pauseJob = async (monitor) => {
		this.deleteJob(monitor);
	};

	resumeJob = async (monitor) => {
		this.addJob(monitor._id, monitor);
	};

	async addJob(jobName, monitor) {
		this.logger.info({
			message: `Adding job ${monitor?.url ?? "No URL"}`,
			service: SERVICE_NAME,
			method: "addJob",
		});

		const queueName = QUEUE_LOOKUP[monitor.type];
		const queue = this.queues[queueName];
		if (typeof queue === "undefined") {
			throw new Error(`Queue for ${monitor.type} not found`);
		}
		const jobTemplate = {
			name: jobName,
			data: monitor,
			opts: {
				attempts: 1,
				backoff: {
					type: "exponential",
					delay: 1000,
				},
				removeOnComplete: true,
				removeOnFail: false,
				timeout: 1 * 60 * 1000,
			},
		};

		const schedulerId = getSchedulerId(monitor);
		await queue.upsertJobScheduler(
			schedulerId,
			{ every: monitor?.interval ?? 60000 },
			jobTemplate
		);
	}

	async deleteJob(monitor) {
		try {
			const queue = this.queues[QUEUE_LOOKUP[monitor.type]];
			const schedulerId = getSchedulerId(monitor);
			const wasDeleted = await queue.removeJobScheduler(schedulerId);

			if (wasDeleted === true) {
				this.logger.info({
					message: this.stringService.jobQueueDeleteJob,
					service: SERVICE_NAME,
					method: "deleteJob",
					details: `Deleted job ${monitor._id}`,
				});
				return true;
			} else {
				this.logger.error({
					message: this.stringService.jobQueueDeleteJob,
					service: SERVICE_NAME,
					method: "deleteJob",
					details: `Failed to delete job ${monitor._id}`,
				});
				return false;
			}
		} catch (error) {
			error.service === undefined ? (error.service = SERVICE_NAME) : null;
			error.method === undefined ? (error.method = "deleteJob") : null;
			throw error;
		}
	}

	async updateJob(monitor) {
		await this.deleteJob(monitor);
		await this.addJob(monitor._id, monitor);
	}

	async getJobs() {
		try {
			let stats = {};
			await Promise.all(
				QUEUE_NAMES.map(async (name) => {
					const queue = this.queues[name];
					const jobs = await queue.getJobs();
					const ret = await Promise.all(
						jobs.map(async (job) => {
							const state = await job.getState();
							return { url: job.data.url, state, progress: job.progress };
						})
					);
					stats[name] = { jobs: ret };
				})
			);
			return stats;
		} catch (error) {
			error.service === undefined ? (error.service = SERVICE_NAME) : null;
			error.method === undefined ? (error.method = "getJobStats") : null;
			throw error;
		}
	}

	async getMetrics() {
		try {
			let metrics = {};

			await Promise.all(
				QUEUE_NAMES.map(async (name) => {
					const queue = this.queues[name];
					const [waiting, active, failed, delayed, repeatableJobs] = await Promise.all([
						queue.getWaitingCount(),
						queue.getActiveCount(),
						queue.getFailedCount(),
						queue.getDelayedCount(),
						queue.getRepeatableJobs(),
					]);

					metrics[name] = {
						waiting,
						active,
						failed,
						delayed,
						repeatableJobs: repeatableJobs.length,
					};
				})
			);

			return metrics;
		} catch (error) {
			this.logger.error({
				message: error.message,
				service: SERVICE_NAME,
				method: "getMetrics",
				stack: error.stack,
			});
		}
	}

	async checkQueueHealth() {
		const res = [];
		for (const queueName of QUEUE_NAMES) {
			const q = this.queues[queueName];
			await q.waitUntilReady();

			const lastJobProcessedTime = q.lastJobProcessedTime;
			const currentTime = Date.now();
			const timeDiff = currentTime - lastJobProcessedTime;

			// Check for jobs
			const jobCounts = await q.getJobCounts();
			const hasJobs = Object.values(jobCounts).some((count) => count > 0);

			res.push({
				queueName,
				timeSinceLastJob: timeDiff,
				stuck: hasJobs && timeDiff > 10000,
				jobCounts,
			});
		}
		return res;
	}

	async flushQueues() {
		try {
			this.logger.warn({
				message: "Flushing queues",
				method: "flushQueues",
				service: SERVICE_NAME,
			});
			for (const worker of this.workers) {
				await worker.close();
			}
			this.workers = [];

			for (const queue of Object.values(this.queues)) {
				await queue.obliterate();
			}
			this.queue = {};
			await this.init();
			return true;
		} catch (error) {
			this.logger.warn({
				message: `${error.message} - Flushing redis manually`,
				service: SERVICE_NAME,
				method: "flushQueues",
			});
			return await this.jobQueueHelper.flushRedis();
		}
	}

	async shutdown() {
		if (this.healthCheckInterval) {
			clearInterval(this.healthCheckInterval);
			this.healthCheckInterval = null;
		}
		for (const worker of this.workers) {
			await worker.close();
		}
		for (const queue of Object.values(this.queues)) {
			await queue.obliterate();
		}
	}
}

export default JobQueue;
