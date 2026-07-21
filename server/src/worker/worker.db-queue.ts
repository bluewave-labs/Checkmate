import { IQueueWorker } from "@/worker/worker.interface.js";
import { type Job, type JobType, LOCK_MS } from "@/domain/jobs/job.type.js";
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
import { JobScheduler } from "@/worker/worker.job-scheduler.js";
import { IBufferService } from "@/service/bufferService.js";
const SERVICE_NAME = "JobQueue";
const POLL_MS = 250; // base poll interval while a loop is actively claiming work
const POLL_MAX_MS = 5000; // back off poll interval to 5s if no jobs
const WORKER_STALE_MS = WORKER_TTL_SECONDS * 1000; // a worker counts as alive if seen within this window
const LOCK_RENEW_MS = LOCK_MS / 3; // renew an in-flight job's lock at 1/3 the lease, so it survives two missed renewals
const DRAIN_TIMEOUT_MS = 25_000;
const DRAIN_POLL_MS = 200;

const CONCURRENCY: Record<JobType, number> = {
	check: 500,
	"geo-check": 20,
	evaluate: 20,
	"cleanup-orphaned": 1,
	"cleanup-retention": 1,
};

export interface DBQueueWorkerDependencies {
	logger: ILogger; // forwarded to super
	isDbConnected: () => boolean;
	jobsRepository: IJobsRepository; // forwarded
	monitorsRepository: IMonitorsRepository; // forwarded
	checksRepository: IChecksRepository;
	checkService: ICheckService;
	bufferService: IBufferService;
	checkProducer: ICheckProducer;
	checkEvaluator: ICheckEvaluator;
	geoCheckPipeline: ICheckPipeline;
	dispatcher: IReactorDispatcher;
	helper: IWorkerHelper;
	queueWorkersRepository: IQueueWorkersRepository; // forwarded
	queueMode: QueueMode; // forwarded
	queuePrimaryProcesses: boolean; // consumed immediately
	workerId: string;
}

export class DBQueueWorker extends JobScheduler implements IQueueWorker {
	static SERVICE_NAME = SERVICE_NAME;

	private initComplete: boolean = false;
	private lastTickAt: number | null = null;

	private inFlight: Record<JobType, number> = {
		check: 0,
		"geo-check": 0,
		evaluate: 0,
		"cleanup-orphaned": 0,
		"cleanup-retention": 0,
	};

	private checksRepository: IChecksRepository;
	private checkProducer: ICheckProducer;
	private checkService: ICheckService;
	private checkEvaluator: ICheckEvaluator;
	private dispatcher: IReactorDispatcher;
	private geoCheckPipeline: ICheckPipeline;
	private helper: IWorkerHelper;
	private bufferService: IBufferService;
	private isDbConnected: () => boolean;

	constructor(dependencies: DBQueueWorkerDependencies) {
		super(
			dependencies.jobsRepository,
			dependencies.queueWorkersRepository,
			dependencies.monitorsRepository,
			dependencies.queueMode,
			dependencies.logger,
			dependencies.workerId
		);
		this.processesJobs = dependencies.queuePrimaryProcesses === true || dependencies.queueMode === "worker";
		this.checksRepository = dependencies.checksRepository;
		this.checkProducer = dependencies.checkProducer;
		this.checkService = dependencies.checkService;
		this.checkEvaluator = dependencies.checkEvaluator;
		this.dispatcher = dependencies.dispatcher;
		this.geoCheckPipeline = dependencies.geoCheckPipeline;
		this.helper = dependencies.helper;
		this.bufferService = dependencies.bufferService;
		this.isDbConnected = dependencies.isDbConnected;
	}

	get serviceName() {
		return DBQueueWorker.SERVICE_NAME;
	}

	static async create(dependencies: DBQueueWorkerDependencies): Promise<DBQueueWorker> {
		const instance = new DBQueueWorker(dependencies);
		await instance.init();
		return instance;
	}

	private getInFlightCount = () => Object.values(this.inFlight).reduce((sum, n) => sum + n, 0);

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
			this.logger.warn({
				message: error instanceof Error ? error.message : String(error),
				service: SERVICE_NAME,
				method: `runJob:${job.type}`,
			});
			await this.jobsRepository.recordFailure(job.id, error, Date.now()).catch((recordError: unknown) => {
				this.logger.error({
					message: `recordFailure failed for job ${job.id}: ${recordError instanceof Error ? recordError.message : String(recordError)}`,
					service: SERVICE_NAME,
					method: `runJob:${job.type}`,
				});
			}); // Record failure and release lock
		} finally {
			clearInterval(renewTimer);
		}
	};

	private startLoop = (type: JobType) => {
		this.pollMs[type] = POLL_MS;
		const tick = async () => {
			this.lastTickAt = Date.now();
			if (this.stopped) return;
			this.ticking[type] = true;
			try {
				// Claim a batch sized to the free capacity
				const capacity = CONCURRENCY[type] - this.inFlight[type];
				const jobs = await this.jobsRepository.claimDueBatch(type, capacity, Date.now());
				for (const job of jobs) {
					this.inFlight[type]++; // stay within concurrency limits
					this.runJob(job)
						.catch((error: unknown) => {
							// defensive, runJob already catches
							this.logger.error({
								message: error instanceof Error ? error.message : String(error),
								service: SERVICE_NAME,
								method: `runJob:${type}`,
							});
						})
						.finally(() => {
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

	override async init() {
		await super.init(); // heartbeat + (primary?) reconcile
		if (this.processesJobs) {
			for (const type of Object.keys(this.inFlight) as JobType[]) {
				this.startLoop(type);
			}
		}
		this.initComplete = true;
		return true;
	}

	override flushQueues = async () => {
		await this.shutdown();
		const ok = await this.init();
		return { success: ok };
	};

	override drain = async () => {
		this.draining = true;
		this.stopped = true;
		const cutoff = Date.now() + DRAIN_TIMEOUT_MS;
		while (this.getInFlightCount() > 0 && Date.now() < cutoff) {
			await new Promise((resolve) => setTimeout(resolve, DRAIN_POLL_MS)); // Wait for DRAIN_POLL_MS for jobs to finish
		}

		const remainingJobs = this.getInFlightCount();
		if (remainingJobs > 0) {
			this.logger.warn({
				message: `Draining timed out with ${remainingJobs} in-flight.  Locks will expire and jobs will be reclaimed`,
				service: SERVICE_NAME,
				method: "drain",
			});
		} else {
			this.logger.info({
				message: `${this.workerId} drained`,
				service: SERVICE_NAME,
				method: "drain",
			});
		}

		await this.bufferService.shutdown(); // Flush buffers
	};

	// ************************
	// Observability
	// ************************

	getHealth = () => {
		return {
			workerId: this.workerId,
			mode: this.queueMode,
			dbConnected: this.isDbConnected(),
			initComplete: this.initComplete,
			draining: this.draining,
			lastTickAt: this.lastTickAt,
			inFlight: this.getInFlightCount(),
		};
	};

	countDueBacklog = () => {
		return this.jobsRepository.countDueBacklog(Date.now());
	};

	countAliveWorkers = async () => {
		const workers = await this.queueWorkersRepository.findRecent(WORKER_STALE_MS);
		return workers.filter((worker) => worker.processesJobs).length;
	};
}
