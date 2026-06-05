import { IMonitorsRepository } from "@/repositories/index.js";
import { ILogger } from "@/utils/logger.js";
import Scheduler from "super-simple-scheduler";
import { IQueueHelper } from "@/service/infrastructure/JobQueues/QueueHelper.js";
import { Monitor, MonitorType, supportsGeoCheck } from "@/types/monitor.js";
import { hostname } from "node:os";
import { randomUUID } from "node:crypto";
import { QueueMode } from "@/types/settings.js";
import { IJobQueue, type QueueJobSummary } from "@/service/infrastructure/JobQueues/IJobQueue.js";

const SERVICE_NAME = "JobQueue";

export class SuperSimpleQueue implements IJobQueue {
	static SERVICE_NAME = SERVICE_NAME;

	private logger: ILogger;
	private helper: IQueueHelper;
	private workerId: string;
	private monitorsRepository: IMonitorsRepository;
	private readonly scheduler: Scheduler;

	constructor(logger: ILogger, helper: IQueueHelper, monitorsRepository: IMonitorsRepository, scheduler: Scheduler) {
		this.logger = logger;
		this.helper = helper;
		this.monitorsRepository = monitorsRepository;
		this.scheduler = scheduler;
		this.registerListeners();
		this.workerId = `${hostname()}:${process.pid}:${randomUUID()}`;
	}

	get serviceName() {
		return SuperSimpleQueue.SERVICE_NAME;
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

		this.scheduler.on("scheduler:error", (error) => {
			this.logger.error({
				message: `Scheduler error: ${error instanceof Error ? error.message : String(error)}`,
				service: SERVICE_NAME,
				stack: error instanceof Error ? error.stack : undefined,
			});
		});

		this.scheduler.on("job:abort", (job, reason) => {
			this.logger.warn({
				message: `${job.id} aborted: ${reason}`,
				service: SERVICE_NAME,
			});
		});

		this.scheduler.on("job:attempt", (job, attempt) => {
			this.logger.debug({
				message: `${job.id} attempt ${attempt}`,
				service: SERVICE_NAME,
			});
		});

		this.scheduler.on("job:complete", (job) => {
			this.logger.debug({
				message: `${job.id} completed successfully`,
				service: SERVICE_NAME,
			});
		});

		this.scheduler.on("job:exhausted", (job, error) => {
			this.logger.error({
				message: `${job.id} exhausted all retries: ${error instanceof Error ? error.message : String(error)}`,
				service: SERVICE_NAME,
				stack: error instanceof Error ? error.stack : undefined,
			});
		});

		this.scheduler.on("job:fail", (job, error, attempt) => {
			this.logger.warn({
				message: `${job.id} failed on attempt ${attempt}: ${error instanceof Error ? error.message : String(error)}`,
				service: SERVICE_NAME,
				stack: error instanceof Error ? error.stack : undefined,
			});
		});

		this.scheduler.on("job:start", (job) => {
			this.logger.debug({
				message: `${job.id} started`,
				service: SERVICE_NAME,
			});
		});
	};

	static async create(logger: ILogger, helper: IQueueHelper, monitorsRepository: IMonitorsRepository) {
		const scheduler = new Scheduler({
			concurrency: 50,
			// storeType: "mongo",
			// storeType: "redis",
			// dbUri: envSettings.dbConnectionString,
		});
		const instance = new SuperSimpleQueue(logger, helper, monitorsRepository, scheduler);
		await instance.init();

		return instance;
	}

	init = async () => {
		try {
			this.scheduler.start();
			this.scheduler.addTemplate("monitor-job", this.helper.getHeartbeatJob());
			this.scheduler.addTemplate("geo-check-job", this.helper.getHeartbeatGeoJob());
			this.scheduler.addTemplate("cleanup-orphaned", this.helper.getCleanupOrphanedJob());
			this.scheduler.addTemplate("cleanup-retention-job", this.helper.getCleanupRetentionJob());
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

			this.scheduler.addJob({ id: "cleanup-orphaned", template: "cleanup-orphaned", active: true });
			this.scheduler.addJob({ id: "cleanup-retention", template: "cleanup-retention-job", active: true, repeat: 24 * 60 * 60 * 1000 });

			return true;
		} catch (error: unknown) {
			this.logger.error({
				message: `Failed to initialize SuperSimpleQueue: ${error instanceof Error ? error.message : String(error)}`,
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
		});
	};

	updateJob = async (monitor: Monitor) => {
		this.scheduler.updateJob(monitor.id, { repeat: monitor.interval, data: monitor });
		await this.syncGeoJob(monitor);
	};

	shutdown = async () => {
		this.scheduler.stop();
	};

	getMetrics = async () => {
		const jobs = await this.scheduler.getJobs();
		const metrics: {
			jobs: number;
			activeJobs: number;
			failingJobs: number;
			jobsWithFailures: Array<{
				monitorId: string | number;
				monitorUrl: string;
				monitorType: MonitorType;
				failedAt: number | null;
				failCount: number;
				failReason: string | null;
			}>;
			totalRuns: number;
			totalFailures: number;
			workers: Array<{
				workerId: string;
				mode: QueueMode;
				lastSeenAt: number;
			}>;
		} = jobs.reduce(
			(acc, job) => {
				const runCount = job.runCount ?? 0;
				const failCount = job.failCount ?? 0;
				const lastFailedAt = job.lastFailedAt ?? 0;
				const lastRunAt = job.lastRunAt ?? 0;
				acc.totalRuns += runCount;
				acc.totalFailures += failCount;
				acc.jobs++;
				if (failCount > 0 && lastFailedAt >= lastRunAt) {
					acc.failingJobs++;
				}

				if (job.lockedAt) {
					acc.activeJobs++;
				}

				if (failCount > 0) {
					acc.jobsWithFailures.push({
						monitorId: job.id,
						monitorUrl: job.data?.url || null,
						monitorType: job.data?.type || null,
						failedAt: job.lastFailedAt ?? null,
						failCount,
						failReason: job.lastFailReason ?? null,
					});
				}
				return acc;
			},
			{
				jobs: 0,
				activeJobs: 0,
				failingJobs: 0,
				jobsWithFailures: [] as Array<{
					monitorId: string | number;
					monitorUrl: string;
					monitorType: MonitorType;
					failedAt: number | null;
					failCount: number;
					failReason: string | null;
				}>,
				totalRuns: 0,
				totalFailures: 0,
				workers: [
					{
						workerId: this.workerId,
						mode: "primary",
						lastSeenAt: Date.now(),
					},
				],
			}
		);
		return metrics;
	};

	getJobs = async ({ page = 0, rowsPerPage = 0 }: { page?: number; rowsPerPage?: number }): Promise<{ jobs: QueueJobSummary[]; count: number }> => {
		const jobs = await this.scheduler.getJobs();
		const mapped = jobs.map((job) => {
			return {
				monitorId: job.id,
				monitorUrl: job.data?.url || null,
				monitorType: job.data?.type || null,
				monitorInterval: job.data?.interval || null,
				monitorGeoInterval: job.data?.geoCheckInterval || null,
				monitorActive: job.data?.isActive ?? null,
				active: job.active,
				repeat: job.repeat ?? null,
				lockedBy: job.lockedAt ? this.workerId : null,
				lockedUntil: null,
				lockedAt: job.lockedAt ?? null,
				runCount: job.runCount ?? 0,
				failCount: job.failCount ?? 0,
				failReason: job.lastFailReason ?? null,
				lastRunAt: job.lastRunAt ?? null,
				lastFinishedAt: job.lastFinishedAt ?? null,
				lastRunTook: job.lockedAt ? null : (job.lastFinishedAt ?? 0) - (job.lastRunAt ?? 0),
				lastFailedAt: job.lastFailedAt ?? null,
			};
		});

		const start = Math.max(page, 0) * rowsPerPage;
		return {
			jobs: rowsPerPage > 0 ? mapped.slice(start, start + rowsPerPage) : mapped,
			count: mapped.length,
		};
	};

	flushQueues = async () => {
		const stopRes = await this.scheduler.stop();
		const flushRes = await this.scheduler.flushJobs();
		const initRes = await this.init();
		return {
			success: Boolean(stopRes && flushRes && initRes),
		};
	};
}
