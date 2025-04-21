import IORedis from "ioredis";

const QUEUE_NAMES = ["uptime", "pagespeed", "hardware", "distributed"];
const SERVICE_NAME = "JobQueue";
const JOBS_PER_WORKER = 5;
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

class NewJobQueue {
	static SERVICE_NAME = SERVICE_NAME;

	constructor(
		db,
		statusService,
		networkService,
		notificationService,
		settingsService,
		stringService,
		logger,
		Queue,
		Worker
	) {
		const settings = settingsService.getSettings() || {};
		const { redisUrl } = settings;
		const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
		this.queues = {};
		this.workers = {};
		this.lastJobProcessedTime = {};

		this.connection = connection;
		this.db = db;
		this.networkService = networkService;
		this.statusService = statusService;
		this.notificationService = notificationService;
		this.settingsService = settingsService;
		this.logger = logger;
		this.Worker = Worker;
		this.stringService = stringService;

		QUEUE_NAMES.forEach((name) => {
			const q = new Queue(name, { connection });
			this.lastJobProcessedTime[q.name] = Date.now();
			q.on("error", (error) => {
				this.logger.error({
					message: error.message,
					service: SERVICE_NAME,
					method: "queue:error",
					stack: error.stack,
				});
			});
			this.queues[name] = q;

			this.workers[name] = [];
		});

		this.healthCheckInterval = setInterval(async () => {
			try {
				const health = await this.checkQueueHealth();
				if (health.stuck === true) {
					this.logger.error({
						message: `Queue is stuck: ${health.stuckQueues.join(", ")}`,
						service: SERVICE_NAME,
						method: "healthCheckInterval",
					});
					await this.flushQueue();
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
	}

	/**
	 * Initializes job queues by adding jobs for all active monitors
	 * @async
	 * @function initJobQueue
	 * @description Retrieves all monitors from the database and adds jobs for active ones to their respective queues
	 * @throws {Error} If there's an error retrieving monitors or adding jobs
	 * @returns {Promise<void>}
	 */
	async initJobQueue() {
		await this.connection.flushall();
		const monitors = await this.db.getAllMonitors();
		await Promise.all(
			monitors
				.filter((monitor) => monitor.isActive)
				.map(async (monitor) => {
					try {
						await this.addJob(monitor._id, monitor);
					} catch (error) {
						this.logger.error({
							message: `Failed to add job for monitor ${monitor._id}:`,
							service: SERVICE_NAME,
							method: "initJobQueue",
							stack: error.stack,
						});
					}
				})
		);
	}

	/**
	 * Checks if a monitor is currently in a maintenance window
	 * @async
	 * @param {string} monitorId - The ID of the monitor to check
	 * @returns {Promise<boolean>} Returns true if the monitor is in an active maintenance window, false otherwise
	 * @throws {Error} If there's an error retrieving maintenance windows from the database
	 * @description
	 * Retrieves all maintenance windows for a monitor and checks if any are currently active.
	 * A maintenance window is considered active if:
	 * 1. The window is marked as active AND
	 * 2. Either:
	 *    - Current time falls between start and end times
	 *    - For repeating windows: Current time falls between any repeated interval
	 */
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

	/**
	 * Creates a job processing handler for monitor checks
	 * @function createJobHandler
	 * @returns {Function} An async function that processes monitor check jobs
	 * @description
	 * Creates and returns a job handler that:
	 * 1. Checks if monitor is in maintenance window
	 * 2. If not in maintenance, performs network status check
	 * 3. Updates monitor status in database
	 * 4. Triggers notifications if status changed
	 *
	 * @param {Object} job - The job to process
	 * @param {Object} job.data - The monitor data
	 * @param {string} job.data._id - Monitor ID
	 * @param {string} job.id - Job ID
	 *
	 * @throws {Error} Logs errors but doesn't throw them to prevent job failure
	 * @returns {Promise<void>} Resolves when job processing is complete
	 */
	createJobHandler() {
		return async (job) => {
			try {
				// Update the last job processed time for this queue
				this.lastJobProcessedTime[job.queue.name] = Date.now();
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
					return;
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

	/**
	 * Creates a new worker for processing jobs in a queue
	 * @param {Queue} queue - The BullMQ queue to create a worker for
	 * @returns {Worker} A new BullMQ worker instance
	 * @description
	 * Creates and configures a new worker with:
	 * - Queue-specific job handler
	 * - Redis connection settings
	 * - Default worker options
	 * The worker processes jobs from the specified queue using the job handler
	 * created by createJobHandler()
	 *
	 * @throws {Error} If worker creation fails or connection is invalid
	 */
	createWorker(queue) {
		try {
			const worker = new this.Worker(queue.name, this.createJobHandler(), {
				connection: this.connection,
				concurrency: 5,
				stalledInterval: 10000,
				maxStalledCount: 1,
				lockDuration: 60000,
			});

			worker.on("failed", (job, err) => {
				this.logger.error({
					message: `Job ${job.id} failed: ${err.message}`,
					service: SERVICE_NAME,
					method: "worker:failed",
					stack: err.stack,
					jobData: job.data,
				});
			});
			worker.on("error", (job, err) => {
				this.logger.error({
					message: `Job ${job.id} error: ${err.message}`,
					service: SERVICE_NAME,
					method: "worker:error",
					stack: err.stack,
					jobData: job.data,
				});
			});

			worker.on("stalled", (jobId) => {
				this.logger.warn({
					message: `Job ${jobId} stalled`,
					service: SERVICE_NAME,
					method: "worker:stalled",
				});
			});

			return worker;
		} catch (error) {
			this.logger.error({
				message: error.message,
				service: SERVICE_NAME,
				method: "createWorker",
				stack: error.stack,
			});
			error.service = SERVICE_NAME;
			error.method = "createWorker";
			throw error;
		}
	}

	/**
	 * Gets stats related to the workers
	 * This is used for scaling workers right now
	 * In the future we will likely want to scale based on server performance metrics
	 * CPU Usage & memory usage, if too high, scale down workers.
	 * When to scale up?  If jobs are taking too long to complete?
	 * @async
	 * @returns {Promise<WorkerStats>} - Returns the worker stats
	 */
	async getWorkerStats(queue) {
		try {
			const jobs = await queue.getRepeatableJobs();
			const load = jobs.length / this.workers[queue.name].length;
			return { jobs, load };
		} catch (error) {
			error.service === undefined ? (error.service = SERVICE_NAME) : null;
			error.method === undefined ? (error.method = "getWorkerStats") : null;
			throw error;
		}
	}

	/**
	 * Scales workers up or down based on queue load
	 * @async
	 * @param {Object} workerStats - Statistics about current worker load
	 * @param {number} workerStats.load - Current load per worker
	 * @param {Array} workerStats.jobs - Array of current jobs
	 * @param {Queue} queue - The BullMQ queue to scale workers for
	 * @returns {Promise<boolean>} True if scaling occurred, false if no scaling was needed
	 * @throws {Error} If no workers array exists for the queue
	 * @description
	 * Scales workers based on these rules:
	 * - Maintains minimum of 5 workers
	 * - Adds workers if load exceeds JOBS_PER_WORKER
	 * - Removes workers if load is below JOBS_PER_WORKER
	 * - Creates initial workers if none exist
	 * Worker scaling is calculated based on excess jobs or excess capacity
	 */
	async scaleWorkers(workerStats, queue) {
		const workers = this.workers[queue.name];
		if (workers === undefined) {
			throw new Error(`No workers found for ${queue.name}`);
		}

		if (workers.length === 0) {
			// There are no workers, need to add one
			for (let i = 0; i < 5; i++) {
				const worker = this.createWorker(queue);
				workers.push(worker);
			}
			return true;
		}
		if (workerStats.load > JOBS_PER_WORKER) {
			// Find out how many more jobs we have than current workers can handle
			const excessJobs = workerStats.jobs.length - workers.length * JOBS_PER_WORKER;
			// Divide by jobs/worker to find out how many workers to add
			const workersToAdd = Math.ceil(excessJobs / JOBS_PER_WORKER);
			for (let i = 0; i < workersToAdd; i++) {
				const worker = this.createWorker(queue);
				workers.push(worker);
			}
			return true;
		}

		if (workerStats.load < JOBS_PER_WORKER) {
			// Find out how much excess capacity we have
			const workerCapacity = workers.length * JOBS_PER_WORKER;
			const excessCapacity = workerCapacity - workerStats.jobs.length;
			// Calculate how many workers to remove
			let workersToRemove = Math.floor(excessCapacity / JOBS_PER_WORKER); // Make sure there are always at least 5
			while (workersToRemove > 0 && workers.length > 5) {
				const worker = workers.pop();
				workersToRemove--;
				await worker.close().catch((error) => {
					// Catch the error instead of throwing it
					this.logger.error({
						message: error.message,
						service: SERVICE_NAME,
						method: "scaleWorkers",
						stack: error.stack,
					});
				});
			}
			return true;
		}
		return false;
	}

	/**
	 * Gets all jobs in the queue.
	 *
	 * @async
	 * @returns {Promise<Array<Job>>}
	 * @throws {Error} - Throws error if getting jobs fails
	 */
	async getJobs(queue) {
		try {
			const jobs = await queue.getRepeatableJobs();
			return jobs;
		} catch (error) {
			error.service === undefined ? (error.service = SERVICE_NAME) : null;
			error.method === undefined ? (error.method = "getJobs") : null;
			throw error;
		}
	}

	/**
	 * Retrieves detailed statistics about jobs and workers for all queues
	 * @async
	 * @returns {Promise<Object>} Queue statistics object
	 * @throws {Error} If there's an error retrieving job information
	 * @description
	 * Returns an object with statistics for each queue including:
	 * - List of jobs with their URLs and current states
	 * - Number of workers assigned to the queue
	 */
	async getJobStats() {
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
					stats[name] = { jobs: ret, workers: this.workers[name].length };
				})
			);
			return stats;
		} catch (error) {
			error.service === undefined ? (error.service = SERVICE_NAME) : null;
			error.method === undefined ? (error.method = "getJobStats") : null;
			throw error;
		}
	}

	/**
	 * Adds both immediate and repeatable jobs to the appropriate queue
	 * @async
	 * @param {string} jobName - Name identifier for the job
	 * @param {Object} monitor - Job data and configuration
	 * @param {string} monitor.type - Type of monitor/queue ('uptime', 'pagespeed', 'hardware')
	 * @param {string} [monitor.url] - URL to monitor (optional)
	 * @param {number} [monitor.interval=60000] - Repeat interval in milliseconds
	 * @param {string} monitor._id - Monitor ID
	 * @throws {Error} If queue not found for payload type
	 * @throws {Error} If job addition fails
	 * @description
	 * 1. Identifies correct queue based on payload type
	 * 2. Adds immediate job execution
	 * 3. Adds repeatable job with specified interval
	 * 4. Scales workers based on updated queue load
	 * Jobs are configured with exponential backoff, single attempt,
	 * and automatic removal on completion
	 */
	async addJob(jobName, monitor) {
		try {
			this.logger.info({
				message: `Adding job ${monitor?.url ?? "No URL"}`,
				service: SERVICE_NAME,
				method: "addJob",
			});

			// Find the correct queue

			const queue = this.queues[QUEUE_LOOKUP[monitor.type]];
			if (queue === undefined) {
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

			const workerStats = await this.getWorkerStats(queue);
			await this.scaleWorkers(workerStats, queue);
		} catch (error) {
			error.service === undefined ? (error.service = SERVICE_NAME) : null;
			error.method === undefined ? (error.method = "addJob") : null;
			throw error;
		}
	}

	/**
	 * Deletes a repeatable job from its queue and adjusts worker scaling
	 * @async
	 * @param {Object} monitor - Monitor object containing job details
	 * @param {string} monitor._id - ID of the monitor/job to delete
	 * @param {string} monitor.type - Type of monitor determining queue selection
	 * @param {number} monitor.interval - Job repeat interval in milliseconds
	 * @throws {Error} If queue not found for monitor type
	 * @throws {Error} If job deletion fails
	 * @description
	 * 1. Identifies correct queue based on monitor type
	 * 2. Removes repeatable job using monitor ID and interval
	 * 3. Logs success or failure of deletion
	 * 4. Updates worker scaling based on new queue load
	 * Returns void but logs operation result
	 */
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
				const workerStats = await this.getWorkerStats(queue);
				await this.scaleWorkers(workerStats, queue);
			} else {
				this.logger.error({
					message: this.stringService.jobQueueDeleteJob,
					service: SERVICE_NAME,
					method: "deleteJob",
					details: `Failed to delete job ${monitor._id}`,
				});
			}
		} catch (error) {
			error.service === undefined ? (error.service = SERVICE_NAME) : null;
			error.method === undefined ? (error.method = "deleteJob") : null;
			throw error;
		}
	}

	/**
	 * Retrieves comprehensive metrics for all queues
	 * @async
	 * @returns {Promise<Object.<string, QueueMetrics>>} Object with metrics for each queue
	 * @throws {Error} If metrics retrieval fails
	 * @description
	 * Collects the following metrics for each queue:
	 * - Number of waiting jobs
	 * - Number of active jobs
	 * - Number of completed jobs
	 * - Number of failed jobs
	 * - Number of delayed jobs
	 * - Number of repeatable jobs
	 * - Number of active workers
	 *
	 * @typedef {Object} QueueMetrics
	 * @property {number} waiting - Count of jobs waiting to be processed
	 * @property {number} active - Count of jobs currently being processed
	 * @property {number} completed - Count of successfully completed jobs
	 * @property {number} failed - Count of failed jobs
	 * @property {number} delayed - Count of delayed jobs
	 * @property {number} repeatableJobs - Count of repeatable job patterns
	 * @property {number} workers - Count of active workers for this queue
	 */
	async getMetrics() {
		try {
			let metrics = {};

			await Promise.all(
				QUEUE_NAMES.map(async (name) => {
					const queue = this.queues[name];
					const workers = this.workers[name];
					const [waiting, active, completed, failed, delayed, repeatableJobs] =
						await Promise.all([
							queue.getWaitingCount(),
							queue.getActiveCount(),
							queue.getCompletedCount(),
							queue.getFailedCount(),
							queue.getDelayedCount(),
							queue.getRepeatableJobs(),
						]);

					metrics[name] = {
						waiting,
						active,
						completed,
						failed,
						delayed,
						repeatableJobs: repeatableJobs.length,
						workers: workers.length,
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

	/**
	 * @async
	 * @returns {Promise<boolean>} - Returns true if obliteration is successful
	 */

	async obliterate() {
		try {
			this.logger.info({
				message: "Attempting to obliterate job queue...",
				service: SERVICE_NAME,
				method: "obliterate",
			});

			if (this.healthCheckInterval) {
				clearInterval(this.healthCheckInterval);
				this.healthCheckInterval = null;
			}

			await Promise.all(
				QUEUE_NAMES.map(async (name) => {
					const queue = this.queues[name];
					await queue.pause();
					const jobs = await this.getJobs(queue);

					// Remove all repeatable jobs
					for (const job of jobs) {
						await queue.removeRepeatableByKey(job.key);
						await queue.remove(job.id);
					}
				})
			);

			// Close workers
			await Promise.all(
				QUEUE_NAMES.map(async (name) => {
					const workers = this.workers[name];
					await Promise.all(
						workers.map(async (worker) => {
							await worker.close();
						})
					);
				})
			);

			QUEUE_NAMES.forEach(async (name) => {
				const queue = this.queues[name];
				await queue.obliterate();
			});

			const metrics = await this.getMetrics();
			this.logger.info({
				message: this.stringService.jobQueueObliterate,
				service: SERVICE_NAME,
				method: "obliterate",
				details: metrics,
			});
			return true;
		} catch (error) {
			error.service === undefined ? (error.service = SERVICE_NAME) : null;
			error.method === undefined ? (error.method = "obliterate") : null;
			throw error;
		}
	}

	// **************************
	//  Queue Health Checks
	// **************************
	async getKeyValuePairs() {
		try {
			// Get all keys
			const keys = await this.connection.keys("*");

			if (keys.length === 0) {
				return {}; // Return an empty object if no keys are found
			}

			// Get values for all keys
			const values = await this.connection.mget(keys);

			// Combine keys and values into an object
			const keyValuePairs = keys.reduce((result, key, index) => {
				result[key] = values[index];
				return result;
			}, {});
			this.logger.info({
				message: "Redis key-value",
				service: SERVICE_NAME,
				method: "flushQueue",
				details: keyValuePairs,
			});
			return keyValuePairs;
		} catch (error) {
			error.service === undefined ? (error.service = SERVICE_NAME) : null;
			error.method === undefined ? (error.method = "getKeyValuePairs") : null;
			throw error;
		}
	}

	async flushQueue() {
		try {
			const keyValuePairs = await this.getKeyValuePairs();
			this.logger.info({
				message: "Before flush",
				service: SERVICE_NAME,
				method: "flushQueue",
				details: keyValuePairs,
			});
			const flushResult = await this.connection.flushall();
			const keyValuePairsAfter = await this.getKeyValuePairs();
			this.logger.info({
				message: "After flush",
				service: SERVICE_NAME,
				method: "flushQueue",
				details: keyValuePairsAfter,
			});
			if (flushResult !== "OK") {
				throw new Error("Failed to flush queue");
			}
			await this.initJobQueue();
			return {
				keyValuePairs,
				flush: flushResult,
				keyValuePairsAfter,
				init: true,
			};
		} catch (error) {
			error.service === undefined ? (error.service = SERVICE_NAME) : null;
			error.method === undefined ? (error.method = "flushQueue") : null;
			throw error;
		}
	}

	/**
	 * Gets metrics for a specific queue
	 * @async
	 * @function getQueueHealthMetrics
	 * @param {Queue} queue - The queue to get metrics for
	 * @returns {Promise<Object>} Queue metrics
	 */
	async getQueueHealthMetrics(queue) {
		return await queue.getJobCounts();
	}

	getQueueIdleTimes() {
		const now = Date.now();
		const idleTimes = {};
		Object.entries(this.lastJobProcessedTime).forEach(([queueName, lastProcessed]) => {
			idleTimes[queueName] = now - lastProcessed;
		});
		return idleTimes;
	}
	async checkQueueHealth() {
		try {
			const currentTime = Date.now();
			const stuckQueues = [];
			const idleTimes = this.getQueueIdleTimes();
			for (const queueName of QUEUE_NAMES) {
				const queue = this.queues[queueName];

				const jobCounts = await this.getQueueHealthMetrics(queue);
				const hasJobs = Object.values(jobCounts).some((count) => count > 0);

				const timeSinceLastProcessed = currentTime - this.lastJobProcessedTime[queueName];
				const isStuck = hasJobs && timeSinceLastProcessed > HEALTH_CHECK_INTERVAL;

				if (isStuck) {
					stuckQueues.push(queueName);
				}
			}

			const queueHealth = { stuck: false, stuckQueues, idleTimes };

			if (stuckQueues.length > 0) {
				queueHealth.stuck = true;
			}

			this.logger.info({
				message: "Queue health check",
				service: SERVICE_NAME,
				method: "checkQueueHealth",
				details: queueHealth,
			});
			return queueHealth;
		} catch (error) {
			error.service === undefined ? (error.service = SERVICE_NAME) : null;
			error.method === undefined ? (error.method = "checkQueueHealth") : null;
			throw error;
		}
	}
}

export default NewJobQueue;
