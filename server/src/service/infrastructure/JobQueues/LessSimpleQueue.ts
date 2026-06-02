import { IMonitorsRepository, IQueueWorkersRepository } from "@/repositories/index.js";
import { ILogger } from "@/utils/logger.js";
import { MongoStore, Scheduler, IJob } from "less-simple-scheduler";
import { IQueueHelper } from "@/service/infrastructure/JobQueues/QueueHelper.js";
import { Monitor, supportsGeoCheck } from "@/types/monitor.js";
import { type QueueMetrics, IJobQueue } from "@/service/infrastructure/JobQueues/IJobQueue.js";
import { type QueueMode } from "@/types/settings.js";
import { EnvConfig } from "@/service/system/settingsService.js";
const SERVICE_NAME = "JobQueue";

// How long after its last heartbeat a worker is still considered alive. The
// model's TTL index uses the same window to garbage-collect stale records.
// Heartbeats are driven by the scheduler's `scheduler:heartbeat` event (emitted
// every lockMs/3, so ~5s with the default lockMs), comfortably inside this TTL.
const WORKER_TTL_MS = 30_000;

// For discriminating job types
type MonitorJob = Omit<IJob, "data"> & { data: Monitor };
const MONITOR_TEMPLATES = new Set<string>(["monitor-job", "geo-check-job"]);
const isMonitorJob = (job: IJob): job is MonitorJob => MONITOR_TEMPLATES.has(job.template);

export class LessSimpleQueue implements IJobQueue {
	static SERVICE_NAME = SERVICE_NAME;

	private logger: ILogger;
	private helper: IQueueHelper;
	private monitorsRepository: IMonitorsRepository;
	private workersRepository: IQueueWorkersRepository;
	private readonly scheduler: Scheduler;
	private queueMode: QueueMode;
	private heartbeatListener: ((workerId: string) => void) | null = null;

	constructor(
		logger: ILogger,
		helper: IQueueHelper,
		monitorsRepository: IMonitorsRepository,
		workersRepository: IQueueWorkersRepository,
		scheduler: Scheduler,
		queueMode: QueueMode
	) {
		this.logger = logger;
		this.helper = helper;
		this.monitorsRepository = monitorsRepository;
		this.workersRepository = workersRepository;
		this.scheduler = scheduler;
		this.queueMode = queueMode;
		this.registerListeners();
	}

	get serviceName() {
		return LessSimpleQueue.SERVICE_NAME;
	}

	private registerListeners = () => {
		this.scheduler.on("scheduler:start", () => {
			this.logger.info({
				message: "Scheduler started",
				service: SERVICE_NAME,
			});
		});

		this.scheduler.on("scheduler:stop", () => {
			this.logger.info({
				message: "Scheduler stopped",
				service: SERVICE_NAME,
			});
		});

		this.scheduler.on("scheduler:error", (workerId, error) => {
			this.logger.error({
				message: `${workerId} error: ${error instanceof Error ? error.message : String(error)}`,
				service: SERVICE_NAME,
				stack: error instanceof Error ? error.stack : undefined,
			});
		});

		this.scheduler.on("job:locked", (workerId, job) => {
			this.logger.debug({
				message: `${workerId} ${job.id} locked`,
				service: SERVICE_NAME,
			});
		});

		this.scheduler.on("job:abort", (workerId, job, reason) => {
			this.logger.warn({
				message: `${workerId} ${job.id} aborted: ${reason}`,
				service: SERVICE_NAME,
			});
		});

		this.scheduler.on("job:attempt", (workerId, job, attempt) => {
			this.logger.debug({
				message: `${workerId} ${job.id} attempt ${attempt}`,
				service: SERVICE_NAME,
			});
		});

		this.scheduler.on("job:complete", (workerId, job) => {
			this.logger.debug({
				message: `${workerId} ${job.id} completed successfully`,
				service: SERVICE_NAME,
			});
		});

		this.scheduler.on("job:exhausted", (workerId, job, error) => {
			this.logger.error({
				message: `${workerId} ${job.id} exhausted all retries: ${error instanceof Error ? error.message : String(error)}`,
				service: SERVICE_NAME,
				stack: error instanceof Error ? error.stack : undefined,
			});
		});

		this.scheduler.on("job:fail", (workerId, job, error, attempt) => {
			this.logger.warn({
				message: `${workerId} ${job.id} failed on attempt ${attempt}: ${error instanceof Error ? error.message : String(error)}`,
				service: SERVICE_NAME,
				stack: error instanceof Error ? error.stack : undefined,
			});
		});

		this.scheduler.on("job:start", (workerId, job) => {
			this.logger.debug({
				message: `${workerId} ${job.id} started`,
				service: SERVICE_NAME,
			});
		});
	};

	static async create(
		logger: ILogger,
		helper: IQueueHelper,
		monitorsRepository: IMonitorsRepository,
		workersRepository: IQueueWorkersRepository,
		envSettings: EnvConfig,
		queueMode: QueueMode
	) {
		const store = new MongoStore({
			url: envSettings.dbConnectionString ?? "mongodb://localhost:27017/uptime_db",
		});
		const scheduler = new Scheduler(store, {
			concurrency: 50,
		});
		const instance = new LessSimpleQueue(logger, helper, monitorsRepository, workersRepository, scheduler, queueMode);
		await instance.init(queueMode);

		return instance;
	}

	private startHeartbeat = (queueMode: QueueMode) => {
		const beat = (
			workerId: string // This is the heartbeat function that registers workers
		) =>
			this.workersRepository.upsert(workerId, queueMode).catch((error: unknown) => {
				this.logger.warn({
					message: `Worker heartbeat failed: ${error instanceof Error ? error.message : String(error)}`,
					service: SERVICE_NAME,
					method: "startHeartbeat",
				});
			});
		beat(this.scheduler.workerId); // Beat immediately to register
		if (this.heartbeatListener) {
			this.scheduler.off("scheduler:heartbeat", this.heartbeatListener); // remove old listeners
		}
		this.heartbeatListener = beat; /// Keep a reference to the listener
		this.scheduler.on("scheduler:heartbeat", beat); // beat on every heartbeat
	};

	init = async (queueMode: QueueMode = "primary") => {
		try {
			await this.scheduler.start();
			this.scheduler.addTemplate("monitor-job", this.helper.getHeartbeatJob());
			this.scheduler.addTemplate("geo-check-job", this.helper.getHeartbeatGeoJob());
			this.scheduler.addTemplate("cleanup-orphaned", this.helper.getCleanupOrphanedJob());
			this.scheduler.addTemplate("cleanup-retention-job", this.helper.getCleanupRetentionJob());

			// Register in the worker registry
			this.startHeartbeat(queueMode);

			// If this is a worker, return early - primary will populate queue
			if (queueMode === "worker") {
				this.logger.info({
					message: `Worker queue: ${this.scheduler.workerId} initialized`,
					service: SERVICE_NAME,
					method: "init",
				});
				return true;
			}

			const monitors = await this.monitorsRepository.findAll();
			if (!monitors) {
				return true;
			}
			for (const monitor of monitors) {
				const randomOffset = Math.floor(Math.random() * 100);
				setTimeout(() => {
					this.addJob(monitor.id, monitor);
				}, randomOffset);
			}

			this.scheduler.addJob({ id: "cleanup-orphaned", template: "cleanup-orphaned", active: true, upsert: true });
			this.scheduler.addJob({ id: "cleanup-retention", template: "cleanup-retention-job", active: true, repeat: 24 * 60 * 60 * 1000, upsert: true });

			return true;
		} catch (error: unknown) {
			this.logger.error({
				message: `Failed to initialize LessSimpleQueue: ${error instanceof Error ? error.message : String(error)}`,
				service: SERVICE_NAME,
				method: "init",
			});
			return false;
		}
	};

	addJob = async (monitorId: string, monitor: Monitor) => {
		this.scheduler.addJob({
			id: monitorId,
			template: "monitor-job",
			repeat: monitor.interval,
			active: monitor.isActive,
			data: monitor,
			upsert: true,
		});

		// Return early if we don't need geo checks
		if (!supportsGeoCheck(monitor.type)) {
			return;
		}

		// Add geo check job if enabled for HTTP monitors
		if (monitor.geoCheckEnabled) {
			this.scheduler.addJob({
				id: `${monitorId}-geo`,
				template: "geo-check-job",
				repeat: monitor.geoCheckInterval,
				active: monitor.isActive,
				data: monitor,
				upsert: true,
			});
		}
	};

	deleteJob = async (monitor: Monitor) => {
		this.scheduler.removeJob(monitor.id);
		const geoJob = await this.scheduler.getJob(`${monitor.id}-geo`);
		if (geoJob) await this.scheduler.removeJob(`${monitor.id}-geo`);
	};

	pauseJob = async (monitor: Monitor) => {
		const result = await this.scheduler.pauseJob(monitor.id);
		if (result === false) {
			throw new Error("Failed to pause monitor");
		}
		this.scheduler.updateJob(monitor.id, { data: monitor });

		const geoJob = await this.scheduler.getJob(`${monitor.id}-geo`);
		if (geoJob) {
			const geoRes = await this.scheduler.pauseJob(`${monitor.id}-geo`);
			if (geoRes === false) {
				this.logger.error({
					message: `Failed to pause geo check job for monitor ${monitor.id}`,
					service: SERVICE_NAME,
					method: "pauseJob",
				});
			}
			this.scheduler.updateJob(`${monitor.id}-geo`, { data: monitor });
		}

		this.logger.debug({
			message: `Paused monitor ${monitor.id}`,
			service: SERVICE_NAME,
			method: "pauseJob",
		});
	};

	resumeJob = async (monitor: Monitor) => {
		const result = await this.scheduler.resumeJob(monitor.id);
		if (result === false) {
			throw new Error("Failed to resume monitor");
		}
		this.scheduler.updateJob(monitor.id, { data: monitor });

		const geoJob = await this.scheduler.getJob(`${monitor.id}-geo`);
		if (geoJob) {
			const geoRes = await this.scheduler.resumeJob(`${monitor.id}-geo`);
			if (geoRes === false) {
				this.logger.error({
					message: `Failed to resume geo check job for monitor ${monitor.id}`,
					service: SERVICE_NAME,
					method: "resumeJob",
				});
			}
			this.scheduler.updateJob(`${monitor.id}-geo`, { data: monitor });
		}
		this.logger.debug({
			message: `Resumed monitor ${monitor.id}`,
			service: SERVICE_NAME,
			method: "resumeJob",
		});
	};

	private syncGeoJob = async (monitor: Monitor) => {
		const geoJobId = `${monitor.id}-geo`;
		const existingGeoJob = await this.scheduler.getJob(geoJobId);

		// If geoChecks have been disabled, or the monitor type doesn't support them, remove
		if (!monitor.geoCheckEnabled || !supportsGeoCheck(monitor.type)) {
			if (existingGeoJob) this.scheduler.removeJob(geoJobId);
			return;
		}

		// If the job exists, update it
		if (existingGeoJob) {
			this.scheduler.updateJob(geoJobId, { repeat: monitor.geoCheckInterval, active: monitor.isActive, data: monitor });
			return;
		}

		// Otherwise, create it
		this.scheduler.addJob({
			id: geoJobId,
			template: "geo-check-job",
			repeat: monitor.geoCheckInterval,
			active: monitor.isActive,
			data: monitor,
			upsert: true,
		});
	};

	updateJob = async (monitor: Monitor) => {
		this.scheduler.updateJob(monitor.id, { repeat: monitor.interval, data: monitor });
		await this.syncGeoJob(monitor);
	};

	shutdown = async () => {
		// Stop beating before we remove this worker, so a heartbeat firing between
		// the remove and the scheduler stopping can't re-insert it.
		if (this.heartbeatListener) {
			this.scheduler.off("scheduler:heartbeat", this.heartbeatListener);
			this.heartbeatListener = null;
		}
		await this.workersRepository.deleteById(this.scheduler.workerId).catch((error: unknown) => {
			this.logger.warn({
				message: `Failed to deregister worker on shutdown: ${error instanceof Error ? error.message : String(error)}`,
				service: SERVICE_NAME,
				method: "shutdown",
			});
		});
		this.scheduler.stop();
	};

	getMetrics = async () => {
		const jobs = await this.scheduler.getJobs();
		const now = Date.now();

		const metrics = jobs.reduce<QueueMetrics>(
			(acc, job) => {
				const runCount = job.runCount ?? 0;
				const failCount = job.failCount ?? 0;
				const lastFailedAt = job.lastFailedAt ?? 0;
				const lastFinishedAt = job.lastFinishedAt ?? 0;
				acc.totalRuns += runCount;
				acc.totalFailures += failCount;
				acc.jobs++;
				if (failCount > 0 && lastFailedAt >= lastFinishedAt) {
					acc.failingJobs++;
				}

				// A job currently held by a live lock is in flight on some worker
				if (job.lockedBy && job.lockedUntil && job.lockedUntil > now) {
					acc.activeJobs++;
				}

				if (failCount > 0) {
					const monitor = isMonitorJob(job) ? job.data : undefined;
					acc.jobsWithFailures.push({
						monitorId: job.id,
						monitorUrl: monitor?.url || null,
						monitorType: monitor?.type || null,
						failedAt: job.lastFailedAt ?? null,
						failCount,
						failReason: job.lastError ?? null,
					});
				}
				return acc;
			},
			{
				jobs: 0,
				activeJobs: 0,
				failingJobs: 0,
				jobsWithFailures: [],
				totalRuns: 0,
				totalFailures: 0,
				workers: [],
			}
		);
		metrics.workers = await this.workersRepository.findRecent(WORKER_TTL_MS);
		return metrics;
	};

	getJobs = async () => {
		const jobs = await this.scheduler.getJobs();
		return jobs.map((job) => {
			const monitor = isMonitorJob(job) ? job.data : undefined;

			return {
				monitorId: job.id,
				monitorUrl: monitor?.url || null,
				monitorType: monitor?.type || null,
				monitorInterval: monitor?.interval || null,
				monitorGeoInterval: monitor?.geoCheckInterval || null,
				monitorActive: monitor?.isActive ?? null,
				active: job.active,
				repeat: job.repeat ?? null,
				lockedBy: job.lockedBy ?? null,
				lockedUntil: job.lockedUntil ?? null,
				lockedAt: job.lockedAt ?? null,
				runCount: job.runCount ?? 0,
				failCount: job.failCount ?? 0,
				failReason: job.lastError ?? null,
				lastRunAt: job.lastStartedAt ?? null,
				lastFinishedAt: job.lastFinishedAt ?? null,
				lastRunTook: job.lockedAt || !job.lastFinishedAt || !job.lastStartedAt ? null : job.lastFinishedAt - job.lastStartedAt,
				lastFailedAt: job.lastFailedAt ?? null,
			};
		});
	};

	flushQueues = async () => {
		if (this.queueMode !== "primary") {
			// Don't allow workers to flush, though this isn't currently reachable since workers have no API endpoints
			this.logger.warn({ message: "Ignoring flush on non-primary worker", service: SERVICE_NAME, method: "flushQueues" });
			return { success: false };
		}

		const flushRes = await this.scheduler.flushJobs(); // Less Simple Queue must flush before stopping as it needs DB
		const stopRes = await this.scheduler.stop(); // Destructive, other workers will abort their jobs
		const initRes = await this.init();
		return {
			success: Boolean(stopRes && flushRes && initRes),
		};
	};
}
