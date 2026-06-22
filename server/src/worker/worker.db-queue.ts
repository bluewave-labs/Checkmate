import { Monitor, supportsGeoCheck } from "@/domain/monitors/monitor.types.js";
import { IWorker, WorkerJobsPagination, WorkerJobSummary, WorkerMetrics } from "@/worker/worker.interface.js";
import { type Job, type JobSeed, type JobType, jobId, LOCK_MS } from "@/domain/jobs/job.type.js";
import { ILogger } from "@/utils/logger.js";
import { IJobsRepository } from "@/domain/jobs/job.repository.interface.js";
import { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";
import { IChecksRepository } from "@/domain/checks/check.repository.interface.js";
import { ICheckService } from "@/domain/checks/check.service.js";
import { ICheckProducer } from "@/worker/worker.check-producer.js";
import { ICheckEvaluator } from "@/worker/worker.check-evaluator.js";
import { ICheckPipeline } from "@/worker/worker.check-pipeline.js";
import { IReactorDispatcher } from "@/worker/reactors/reactor.dispatcher.js";
import { IWorkerHelper } from "@/worker/worker.helper.js";
import { IQueueWorkersRepository } from "@/domain/queue-workers/queue-worker.repository.interface.js";
import { WORKER_TTL_SECONDS } from "@/domain/queue-workers/queue-worker.model.js";
import { QueueMode } from "@/domain/app-settings/app-settings.type.js";
const SERVICE_NAME = "JobQueue";
const POLL_MS = 250; // base poll interval while a loop is actively claiming work
const POLL_MAX_MS = 5000; // back off poll interval to 5s if no jobs
const WORKER_STALE_MS = WORKER_TTL_SECONDS * 1000; // a worker counts as alive if seen within this window
const HEARTBEAT_MS = WORKER_STALE_MS / 3; // Worker can miss two beats without being considered stale
const LOCK_RENEW_MS = LOCK_MS / 3; // renew an in-flight job's lock at 1/3 the lease, so it survives two missed renewals
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
const CONCURRENCY: Record<JobType, number> = {
	check: 500,
	"geo-check": 20,
	evaluate: 20,
	"cleanup-orphaned": 1,
	"cleanup-retention": 1,
};

export class DBQueueWorker implements IWorker {
	static SERVICE_NAME = SERVICE_NAME;
	private stopped = false;
	private timers = new Map<JobType | "heartbeat", NodeJS.Timeout>();
	private inFlight: Record<JobType, number> = {
		check: 0,
		"geo-check": 0,
		evaluate: 0,
		"cleanup-orphaned": 0,
		"cleanup-retention": 0,
	};

	// Per job type poll intervals.  These back off on idle and reset on work or wake()
	private pollMs: Record<JobType, number> = {
		check: POLL_MS,
		"geo-check": POLL_MS,
		evaluate: POLL_MS,
		"cleanup-orphaned": POLL_MS,
		"cleanup-retention": POLL_MS,
	};
	private ticking: Partial<Record<JobType, boolean>> = {}; // Whether a loop is mid tick
	private tickFns = new Map<JobType, () => void>(); // Store tick fns so we can run them immediately on wake

	constructor(
		private logger: ILogger,
		private jobsRepository: IJobsRepository,
		private monitorsRepository: IMonitorsRepository,
		private checksRepository: IChecksRepository,
		private checkService: ICheckService, // toStatusResponse + toLastEvaluatedAt
		private checkProducer: ICheckProducer,
		private checkEvaluator: ICheckEvaluator,
		private geoCheckPipeline: ICheckPipeline,
		private dispatcher: IReactorDispatcher,
		private helper: IWorkerHelper,
		private queueWorkersRepository: IQueueWorkersRepository,
		private queueMode: QueueMode,
		private queuePrimaryProcesses: boolean,
		private readonly workerId: string // same id MongoJobsRepository stamps into lockedBy
	) {}

	get serviceName() {
		return DBQueueWorker.SERVICE_NAME;
	}

	static async create(
		logger: ILogger,
		jobsRepository: IJobsRepository,
		monitorsRepository: IMonitorsRepository,
		checksRepository: IChecksRepository,
		checkService: ICheckService,
		checkProducer: ICheckProducer,
		checkEvaluator: ICheckEvaluator,
		geoCheckPipeline: ICheckPipeline,
		dispatcher: IReactorDispatcher,
		helper: IWorkerHelper,
		queueWorkersRepository: IQueueWorkersRepository,
		queueMode: QueueMode,
		queuePrimaryProcesses: boolean,
		workerId: string
	): Promise<DBQueueWorker> {
		const instance = new DBQueueWorker(
			logger,
			jobsRepository,
			monitorsRepository,
			checksRepository,
			checkService,
			checkProducer,
			checkEvaluator,
			geoCheckPipeline,
			dispatcher,
			helper,
			queueWorkersRepository,
			queueMode,
			queuePrimaryProcesses,
			workerId
		);
		await instance.init();
		return instance;
	}

	// Helpers, builds job seeds. immediate=true runs on the next tick; otherwise jitter spreads the herd.
	private toCheckJob = (monitor: Monitor, now: number, immediate = false): JobSeed => ({
		id: jobId("check", monitor.id),
		type: "check",
		refId: monitor.id,
		isActive: monitor.isActive,
		nextScheduledAt: immediate ? now : now + Math.floor(Math.random() * monitor.interval), // Avoid herd
		intervalMs: monitor.interval,
	});

	private toGeoCheckJob = (monitor: Monitor, now: number, immediate = false): JobSeed => ({
		...this.toCheckJob(monitor, now, immediate),
		id: jobId("geo-check", monitor.id),
		type: "geo-check",
		intervalMs: monitor.geoCheckInterval!,
	});

	private toCleanupJob = (type: "cleanup-orphaned" | "cleanup-retention", now: number): JobSeed => ({
		id: jobId(type, null),
		type,
		refId: null,
		isActive: true,
		nextScheduledAt: now,
		intervalMs: CLEANUP_INTERVAL_MS,
	});

	private toSummary = (job: Job): WorkerJobSummary => ({
		monitorId: job.refId ?? job.id,
		monitorType: job.type,
		monitorInterval: job.intervalMs,
		monitorActive: job.isActive,
		lockedBy: job.lockedBy,
		lockedUntil: job.lockedUntil,
		nextScheduledAt: job.nextScheduledAt,
		runCount: job.runCount,
		failCount: job.failCount,
		failReason: job.lastFailReason,
		lastFinishedAt: job.lastFinishedAt,
	});

	// ********************
	// Stage 1:  This can eventually be offloaded to a separate service
	// ********************

	private runCheck = async (job: Job) => {
		if (!job.refId) return;
		const monitor = await this.monitorsRepository.findByIdLean(job.refId); // job row has no teamId
		if (!monitor) return;
		await this.checkProducer.produce(monitor);
	};

	// ********************
	// Stage 2:  Evaluator loop stays here
	// ********************

	private runEvaluate = async (job: Job) => {
		if (!job.refId) return;
		const monitor = await this.monitorsRepository.findByIdLean(job.refId); // job row has no teamId
		if (!monitor) return;
		const checks = await this.checksRepository.findUnevaluatedByMonitorId(job.refId, monitor.lastEvaluatedAt);

		let current = monitor;
		for (const check of checks) {
			const status = this.checkService.toStatusResponse(check);
			const evaluation = await this.checkEvaluator.evaluate(status, check, current);
			await this.dispatcher.dispatch(evaluation); // Handle incidents and notifications
			await this.monitorsRepository.updateById(job.refId, current.teamId, { lastEvaluatedAt: this.checkService.toLastEvaluatedAt(check) });
			current = evaluation.statusChange.monitor; // fresh statusWindow/status/counters for the next check
		}
	};

	private runGeoCheck = async (job: Job) => {
		const monitor = await this.monitorsRepository.findByIdLean(job.refId!);
		if (monitor) await this.geoCheckPipeline.run(monitor); // returns null; no evaluate handoff
	};

	// Extend the lock while a job runs so a slow-but-alive job is never reclaimed.
	private renewLock = async (job: Job): Promise<boolean> => {
		try {
			const held = await this.jobsRepository.renewLocks([job.id], Date.now());
			if (held === 0) {
				this.logger.warn({ message: `Lost lock on job ${job.id}, stopping renewal`, service: SERVICE_NAME, method: "renewLock" });
				return false;
			}
			return true;
		} catch (error: unknown) {
			this.logger.warn({ message: error instanceof Error ? error.message : String(error), service: SERVICE_NAME, method: "renewLock" });
			return true;
		}
	};

	private runJob = async (job: Job) => {
		const renewTimer = setInterval(async () => {
			const renewLock = await this.renewLock(job);
			if (!renewLock) clearInterval(renewTimer);
		}, LOCK_RENEW_MS);
		try {
			switch (job.type) {
				case "check":
					await this.runCheck(job);
					break;
				case "evaluate":
					await this.runEvaluate(job);
					break;
				case "geo-check":
					await this.runGeoCheck(job);
					break;
				case "cleanup-orphaned":
					await this.helper.getCleanupOrphanedJob()(); // Get job and execute
					break;
				case "cleanup-retention":
					await this.helper.getCleanupRetentionJob()(); // Get job and execute
					break;
			}

			if (job.intervalMs === null) {
				// One-shot job
				await this.jobsRepository.recordOneShot(job.id, Date.now());
			} else {
				await this.jobsRepository.recordSuccess(job.id, job.nextScheduledAt, job.intervalMs, Date.now());
			}
		} catch (error: unknown) {
			await this.jobsRepository.recordFailure(job.id, error, Date.now()); // Record failure and release lock
			this.logger.warn({
				message: error instanceof Error ? error.message : String(error),
				service: SERVICE_NAME,
				method: `runJob:${job.type}`,
			});
		} finally {
			clearInterval(renewTimer);
		}
	};

	private startLoop = (type: JobType) => {
		this.pollMs[type] = POLL_MS;
		const tick = async () => {
			if (this.stopped) return;
			this.ticking[type] = true;
			try {
				// Claim a batch sized to the free capacity
				const capacity = CONCURRENCY[type] - this.inFlight[type];
				const jobs = await this.jobsRepository.claimDueBatch(type, capacity, Date.now());
				for (const job of jobs) {
					this.inFlight[type]++; // stay within concurrency limits
					this.runJob(job).finally(() => {
						this.inFlight[type]--; // job done, free the slot
					});
				}
				// Back off if no jobs found, reset to base if jobs found
				this.pollMs[type] = capacity > 0 && jobs.length === 0 ? Math.min(this.pollMs[type] * 2, POLL_MAX_MS) : POLL_MS;
			} catch (error: unknown) {
				this.logger.error({
					message: error instanceof Error ? error.message : String(error),
					service: SERVICE_NAME,
					method: `loop:${type}`,
				});
			}
			// Clearing the flag and re-arming run synchronously (no await between), so wake() can never interleave here.
			this.ticking[type] = false;
			if (!this.stopped) this.timers.set(type, setTimeout(tick, this.pollMs[type])); // re-arm unless shutting down
		};
		this.tickFns.set(type, tick);
		tick();
	};

	// Wake a worker loop after adding a job that's due immediately.
	// Otherwise the loop could be delayed by POLL_MAX_MS if it is already fully backed off
	wake = (type: JobType) => {
		this.pollMs[type] = POLL_MS;
		if (this.stopped || this.ticking[type]) return; // If it's not running or mid tick, do nothing
		const tick = this.tickFns.get(type);
		if (!tick) return; // Try to get a handle on the tick fn, if we can't we're done
		const pending = this.timers.get(type);
		if (pending) clearTimeout(pending); // Clear out scheduled tick if any
		this.timers.set(type, setTimeout(tick, 0)); // Set immediate tick
	};

	// Seed queue
	private reconcile = async () => {
		const now = Date.now();
		const monitors = (await this.monitorsRepository.findAll()) ?? [];
		for (const monitor of monitors) {
			await this.jobsRepository.upsertJob(this.toCheckJob(monitor, now));
			if (supportsGeoCheck(monitor.type) && monitor.geoCheckEnabled) {
				await this.jobsRepository.upsertJob(this.toGeoCheckJob(monitor, now));
			}
		}
		// Both cleanup jobs run immediately on every startup, then once a day
		await this.jobsRepository.upsertCleanupJob(this.toCleanupJob("cleanup-orphaned", now));
		await this.jobsRepository.upsertCleanupJob(this.toCleanupJob("cleanup-retention", now));
	};

	// Register worker
	private heartbeat = async () => {
		try {
			await this.queueWorkersRepository.upsert(this.workerId, this.queueMode);
		} catch (error: unknown) {
			this.logger.warn({
				message: error instanceof Error ? error.message : String(error),
				service: SERVICE_NAME,
				method: "heartbeat",
			});
		}
	};

	init = async () => {
		this.stopped = false;

		await this.heartbeat();
		this.timers.set("heartbeat", setInterval(this.heartbeat, HEARTBEAT_MS));

		if (this.queueMode === "primary") {
			await this.reconcile();
		}

		if (this.queuePrimaryProcesses === true || this.queueMode === "worker") {
			for (const type of Object.keys(this.inFlight) as JobType[]) {
				this.startLoop(type);
			}
		}
		return true;
	};

	addJob = async (_monitorId: string, monitor: Monitor) => {
		const now = Date.now();
		await this.jobsRepository.upsertJob(this.toCheckJob(monitor, now, true));
		this.wake("check");
		if (supportsGeoCheck(monitor.type) && monitor.geoCheckEnabled) {
			await this.jobsRepository.upsertJob(this.toGeoCheckJob(monitor, now, true));
			this.wake("geo-check");
		}
	};
	deleteJob = async (monitor: Monitor) => {
		await this.jobsRepository.deleteById(monitor.id);
	};
	pauseJob = async (monitor: Monitor) => {
		await this.jobsRepository.setActiveById(monitor.id, false);
	};
	resumeJob = async (monitor: Monitor) => {
		await this.jobsRepository.setActiveById(monitor.id, true); // a paused job's nextScheduledAt is now in the past, so it's due immediately
		this.wake("check");
		if (supportsGeoCheck(monitor.type) && monitor.geoCheckEnabled) this.wake("geo-check");
	};
	updateJob = async (monitor: Monitor) => {
		await this.jobsRepository.updateScheduleById(monitor.id, "check", monitor.interval);
		if (supportsGeoCheck(monitor.type) && monitor.geoCheckEnabled) {
			await this.jobsRepository.upsertJob(this.toGeoCheckJob(monitor, Date.now(), true)); // a newly enabled geo check should run right away
			this.wake("geo-check");
		} else {
			await this.jobsRepository.deleteByIdAndType(monitor.id, "geo-check");
		}
	};
	shutdown = async () => {
		this.stopped = true;
		// Stop all timers
		for (const timer of this.timers.values()) {
			clearTimeout(timer);
		}
		this.timers.clear(); // Clear the map out
		//  Remove workers from registry
		await this.queueWorkersRepository.deleteById(this.workerId);
	};
	getMetrics = async (): Promise<WorkerMetrics> => {
		const rows = await this.jobsRepository.findAll();
		const workers = await this.queueWorkersRepository.findRecent(WORKER_STALE_MS);
		const now = Date.now();
		return rows.reduce<WorkerMetrics>(
			(acc, job) => {
				acc.jobs++;
				acc.totalRuns += job.runCount;
				acc.totalFailures += job.failCount;
				if (job.lockedBy !== null && job.lockedUntil !== null && job.lockedUntil > now) acc.activeJobs++;
				if (job.failCount > 0) {
					acc.failingJobs++;
					acc.jobsWithFailures.push({
						monitorId: job.refId ?? job.id,
						monitorUrl: null,
						monitorType: job.type,
						failedAt: job.lastFinishedAt,
						failCount: job.failCount,
						failReason: job.lastFailReason,
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
				workers,
			}
		);
	};

	getJobs = async (pagination: WorkerJobsPagination) => {
		const { jobs, count } = await this.jobsRepository.findPage(pagination);
		return { jobs: jobs.map(this.toSummary), count };
	};
	flushQueues = async () => {
		await this.shutdown();
		const ok = await this.init();
		return { success: ok };
	};
}
