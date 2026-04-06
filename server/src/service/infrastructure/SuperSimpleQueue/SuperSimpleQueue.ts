import { IMonitorsRepository } from "@/repositories/index.js";
import { ILogger } from "@/utils/logger.js";
import Scheduler from "super-simple-scheduler";
import { ISuperSimpleQueueHelper } from "@/service/infrastructure/SuperSimpleQueue/SuperSimpleQueueHelper.js";
import { Monitor, MonitorType, supportsGeoCheck } from "@/types/monitor.js";
const SERVICE_NAME = "JobQueue";

type QueueJobFailure = {
	monitorId: string | number;
	monitorUrl: string | null;
	monitorType: string | null;
	failedAt: number | null;
	failCount: number;
	failReason: string | null;
};

type QueueMetrics = {
	jobs: number;
	activeJobs: number;
	failingJobs: number;
	jobsWithFailures: QueueJobFailure[];
	totalRuns: number;
	totalFailures: number;
};

type QueueJobSummary = {
	monitorId: string | number;
	monitorUrl: string | null;
	monitorType: string | null;
	monitorInterval: number | null;
	active: boolean;
	lockedAt: number | null;
	runCount: number;
	failCount: number;
	failReason: string | null;
	lastRunAt: number | null;
	lastFinishedAt: number | null;
	lastRunTook: number | null;
	lastFailedAt: number | null;
};

export interface ISuperSimpleQueue {
	readonly serviceName: string;
	init(): Promise<boolean>;
	addJob(monitorId: string, monitor: Monitor): Promise<void>;
	addCustomJob(job: { id: string; template: string; repeat?: number; active?: boolean; data?: any; runAt?: number }): Promise<void>;
	deleteJob(monitor: Monitor): Promise<void>;
	pauseJob(monitor: Monitor): Promise<void>;
	resumeJob(monitor: Monitor): Promise<void>;
	updateJob(monitor: Monitor): Promise<void>;
	shutdown(): Promise<void>;
	getMetrics(): Promise<QueueMetrics>;
	getJobs(): Promise<QueueJobSummary[]>;
	flushQueues(): Promise<{ success: boolean }>;
	obliterate(): Promise<void>;
}

export class SuperSimpleQueue implements ISuperSimpleQueue {
	static SERVICE_NAME = SERVICE_NAME;

	private logger: ILogger;
	private helper: ISuperSimpleQueueHelper;
	private monitorsRepository: IMonitorsRepository;
	private readonly scheduler: Scheduler;

	constructor(logger: ILogger, helper: ISuperSimpleQueueHelper, monitorsRepository: IMonitorsRepository, scheduler: Scheduler) {
		this.logger = logger;
		this.helper = helper;
		this.monitorsRepository = monitorsRepository;
		this.scheduler = scheduler;
	}

	get serviceName() {
		return SuperSimpleQueue.SERVICE_NAME;
	}

	static async create(logger: ILogger, helper: ISuperSimpleQueueHelper, monitorsRepository: IMonitorsRepository) {
		const scheduler = new Scheduler({
			// storeType: "mongo",
			// storeType: "redis",
			logLevel: "debug",
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
			this.scheduler.addTemplate("escalation-job", this.helper.getEscalationJob());
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
		this.scheduler.removeJob(`${monitor.id}-geo`);
	};

	pauseJob = async (monitor: Monitor) => {
		const result = await this.scheduler.pauseJob(monitor.id);
		if (result === false) {
			throw new Error("Failed to pause monitor");
		}
		await this.scheduler.pauseJob(`${monitor.id}-geo`);
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

		await this.scheduler.resumeJob(`${monitor.id}-geo`);

		this.logger.debug({
			message: `Resumed monitor ${monitor.id}`,
			service: SERVICE_NAME,
			method: "resumeJob",
		});
	};

	updateJob = async (monitor: Monitor) => {
		this.scheduler.updateJob(monitor.id, { repeat: monitor.interval, data: monitor });

		// Handle geo check job lifecycle
		const geoJobId = `${monitor.id}-geo`;
		if (monitor.geoCheckEnabled && supportsGeoCheck(monitor.type)) {
			// Check if geo job exists
			const existingGeoJob = await this.scheduler.getJob(geoJobId);
			if (existingGeoJob) {
				// Update existing geo job
				this.scheduler.updateJob(geoJobId, { repeat: monitor.geoCheckInterval, active: monitor.isActive, data: monitor });
			} else {
				// Create new geo job
				this.scheduler.addJob({
					id: geoJobId,
					template: "geo-check-job",
					repeat: monitor.geoCheckInterval,
					active: monitor.isActive,
					data: monitor,
				});
			}
		} else {
			// Remove geo job if disabled or monitor type changed
			this.scheduler.removeJob(geoJobId);
		}
	};

	addCustomJob = async (job: { id: string; template: string; repeat?: number; active?: boolean; data?: any; runAt?: number }) => {
		this.scheduler.addJob(job);
	};

	shutdown = async () => {
		this.scheduler.stop();
	};

	getMetrics = async () => {
		const jobs = await this.scheduler.getJobs();
		const metrics = jobs.reduce(
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
						monitorUrl: job?.data?.url || null,
						monitorType: job?.data?.type || null,
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
			}
		);
		return metrics;
	};

	getJobs = async () => {
		const jobs = await this.scheduler.getJobs();
		return jobs.map((job) => {
			return {
				monitorId: job.id,
				monitorUrl: job?.data?.url || null,
				monitorType: job?.data?.type || null,
				monitorInterval: job?.data?.interval || null,
				active: job.active,
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
	};

	flushQueues = async () => {
		const stopRes = await this.scheduler.stop();
		const flushRes = await this.scheduler.flushJobs();
		const initRes = await this.init();
		return {
			success: Boolean(stopRes && flushRes && initRes),
		};
	};

	obliterate = async () => {
		this.logger.warn({
			message: "obliterate method not implemented",
			service: SERVICE_NAME,
			method: "obliterate",
		});
	};
}
