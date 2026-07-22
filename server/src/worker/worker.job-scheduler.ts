import { IJobScheduler } from "@/worker/worker.interface.js";
import { IJobsRepository } from "@/domain/jobs/job.repository.interface.js";
import { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";
import { Monitor, supportsGeoCheck } from "@/domain/monitors/monitor.types.js";
import { type Job, type JobSeed, type JobType, jobId } from "@/domain/jobs/job.type.js";
import { IQueueWorkersRepository } from "@/domain/queue-workers/queue-worker.repository.interface.js";
import { WorkerJobsPagination, WorkerJobSummary, WorkerMetrics } from "@/worker/worker.interface.js";
import { WORKER_STALE_MS } from "@/domain/queue-workers/queue-worker.model.js";
import { QueueMode } from "@/domain/app-settings/app-settings.type.js";
import { ILogger } from "@/utils/logger.js";

export const POLL_MS = 250; // base poll interval while a loop is actively claiming work
const SERVICE_NAME = "JobScheduler";
const HEARTBEAT_MS = WORKER_STALE_MS / 3; // Worker can miss two beats without being considered stale
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

export class JobScheduler implements IJobScheduler {
	static SERVICE_NAME = SERVICE_NAME;
	constructor(
		protected jobsRepository: IJobsRepository,
		protected queueWorkersRepository: IQueueWorkersRepository,
		protected monitorsRepository: IMonitorsRepository,
		protected queueMode: QueueMode,
		protected logger: ILogger,
		protected readonly workerId: string // same id MongoJobsRepository stamps into lockedBy
	) {}

	private heartbeatInFlight: Promise<void> = Promise.resolve();

	protected processesJobs = false; // scheduler-only by default; DBQueueWorker flips this on when it runs job loops
	protected stopped = false;
	protected draining = false;
	protected ticking: Partial<Record<JobType, boolean>> = {}; // Whether a loop is mid tick
	protected tickFns = new Map<JobType, () => void>(); // Store tick fns so we can run them immediately on wake
	protected timers = new Map<JobType | "heartbeat", NodeJS.Timeout>();

	// Per job type poll intervals.  These back off on idle and reset on work or wake()
	protected pollMs: Record<JobType, number> = {
		check: POLL_MS,
		"geo-check": POLL_MS,
		evaluate: POLL_MS,
		"cleanup-orphaned": POLL_MS,
		"cleanup-retention": POLL_MS,
	};
	// Helpers, builds job seeds. immediate=true runs on the next tick; otherwise jitter spreads the herd.
	protected toCheckJob = (monitor: Monitor, now: number, immediate = false): JobSeed => ({
		id: jobId("check", monitor.id),
		type: "check",
		refId: monitor.id,
		isActive: monitor.isActive,
		nextScheduledAt: immediate ? now : now + Math.floor(Math.random() * monitor.interval), // Avoid herd
		intervalMs: monitor.interval,
	});

	protected toGeoCheckJob = (monitor: Monitor, now: number, immediate = false): JobSeed => ({
		...this.toCheckJob(monitor, now, immediate),
		id: jobId("geo-check", monitor.id),
		type: "geo-check",
		intervalMs: monitor.geoCheckInterval!,
	});

	protected toCleanupJob = (type: "cleanup-orphaned" | "cleanup-retention", now: number): JobSeed => ({
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
	wake = (type: JobType) => {
		this.pollMs[type] = POLL_MS;
		if (this.stopped || this.ticking[type]) return; // If it's not running or mid tick, do nothing
		const tick = this.tickFns.get(type);
		if (!tick) return; // Try to get a handle on the tick fn, if we can't we're done
		const pending = this.timers.get(type);
		if (pending) clearTimeout(pending); // Clear out scheduled tick if any
		this.timers.set(type, setTimeout(tick, 0)); // Set immediate tick
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

	getMetrics = async (): Promise<WorkerMetrics> => {
		const rows = await this.jobsRepository.findAll();
		const recent = await this.queueWorkersRepository.findRecent(WORKER_STALE_MS);
		const workers = recent.filter((worker) => worker.processesJobs);
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
		return { success: true };
	};

	// init is the scheduler's startup: register in the registry + (if primary) seed the queue.
	// Subclasses override to ALSO start processing, calling super.init() first.
	// Declared as a prototype method (not an arrow field) so subclasses can reach it via super.init().
	async init(): Promise<boolean> {
		this.stopped = false;
		await this.heartbeat();
		this.timers.set("heartbeat", setInterval(this.heartbeat, HEARTBEAT_MS));
		if (this.queueMode === "primary") {
			await this.reconcile();
		}
		return true;
	}

	// Seed queue
	protected reconcile = async () => {
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
	protected heartbeat = async () => {
		try {
			if (this.stopped) return; // Don't re-register if shutting down
			this.heartbeatInFlight = this.queueWorkersRepository.upsert(this.workerId, this.queueMode, this.processesJobs).catch((error: unknown) => {
				this.logger.warn({
					message: error instanceof Error ? error.message : String(error),
					service: SERVICE_NAME,
					method: "heartbeat",
				});
			});
			await this.heartbeatInFlight;
		} catch (error: unknown) {
			this.logger.warn({
				message: error instanceof Error ? error.message : String(error),
				service: SERVICE_NAME,
				method: "heartbeat",
			});
		}
	};

	drain = async () => {
		this.stopped = true;
		this.draining = true;
	};

	shutdown = async () => {
		this.stopped = true;
		// Stop all timers
		for (const timer of this.timers.values()) {
			clearTimeout(timer);
		}
		this.timers.clear(); // Clear the map out
		await this.heartbeatInFlight; // Wait for in flight jobs
		//  Remove workers from registry
		await this.queueWorkersRepository.deleteById(this.workerId);
	};
}
