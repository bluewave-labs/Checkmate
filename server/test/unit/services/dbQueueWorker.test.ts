import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";
import { DBQueueWorker } from "../../../src/worker/worker.db-queue.ts";
import { LOCK_MS } from "../../../src/domain/jobs/job.type.ts";
import type { Job } from "../../../src/domain/jobs/job.type.ts";
import type { Monitor } from "../../../src/domain/monitors/monitor.type.ts";
import type { QueueMode } from "../../../src/domain/app-settings/app-settings.type.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

// ── Notes ──────────────────────────────────────────────────────────────────────
//
// DBQueueWorker is the orchestrator: it drives the polling loops, claims batches
// sized to free capacity, runs jobs (check / evaluate / geo-check / cleanup) and
// renews their locks, and registers itself in the worker heartbeat. The repository
// claim/lock atomicity is covered in integration/jobsRepository.test.ts; here we
// test only the orchestration around it, with the repository fully mocked.
//
// Fake timers are mandatory: init() starts self-re-arming setTimeout loops and a
// heartbeat setInterval, so without them the loops would leak across tests. The
// loop re-arms at POLL_MS (250ms) and the lock renews at LOCK_MS / 3 (20s).

const POLL_MS = 250;
const LOCK_RENEW_MS = LOCK_MS / 3;
const DRAIN_TIMEOUT_MS = 25_000; // mirror of DBQueueWorker DRAIN_TIMEOUT_MS
const DRAIN_POLL_MS = 200; // mirror of DBQueueWorker DRAIN_POLL_MS

const deferred = <T>() => {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
};

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "m1",
		teamId: "team",
		type: "http",
		interval: 60000,
		status: "up",
		isActive: true,
		geoCheckEnabled: false,
		geoCheckInterval: 300000,
		lastEvaluatedAt: 0,
		...overrides,
	}) as Monitor;

const makeJob = (overrides?: Partial<Job>): Job => ({
	id: "check:m1",
	type: "check",
	refId: "m1",
	isActive: true,
	nextScheduledAt: 1000,
	intervalMs: 60000,
	lockedBy: null,
	lockedUntil: null,
	runCount: 0,
	failCount: 0,
	lastFinishedAt: null,
	lastFailReason: null,
	...overrides,
});

const createWorker = (overrides?: { queueMode?: QueueMode; queuePrimaryProcesses?: boolean; mocks?: Record<string, any> }) => {
	const jobsRepository = {
		claimDueBatch: jest.fn<any>().mockResolvedValue([]),
		upsertJob: jest.fn<any>().mockResolvedValue(true),
		upsertCleanupJob: jest.fn<any>().mockResolvedValue(true),
		upsertEvaluate: jest.fn<any>().mockResolvedValue(true),
		recordSuccess: jest.fn<any>().mockResolvedValue(true),
		recordFailure: jest.fn<any>().mockResolvedValue(true),
		recordOneShot: jest.fn<any>().mockResolvedValue(true),
		renewLocks: jest.fn<any>().mockResolvedValue(1),
		deleteById: jest.fn<any>().mockResolvedValue(true),
		deleteByIdAndType: jest.fn<any>().mockResolvedValue(true),
		setActiveById: jest.fn<any>().mockResolvedValue(true),
		updateScheduleById: jest.fn<any>().mockResolvedValue(true),
		findAll: jest.fn<any>().mockResolvedValue([]),
		findPage: jest.fn<any>().mockResolvedValue({ jobs: [], count: 0 }),
		countDueBacklog: jest.fn<any>().mockResolvedValue(0),
	};
	const monitorsRepository = {
		findByIds: jest.fn<any>().mockResolvedValue([makeMonitor()]),
		findByIdLean: jest.fn<any>().mockResolvedValue(makeMonitor()),
		findAll: jest.fn<any>().mockResolvedValue([]),
		updateById: jest.fn<any>().mockResolvedValue({}),
	};
	const checksRepository = {
		findUnevaluatedByMonitorId: jest.fn<any>().mockResolvedValue([]),
	};
	const checkService = {
		toStatusResponse: jest.fn<any>().mockReturnValue({ status: "up" }),
		toLastEvaluatedAt: jest.fn<any>().mockReturnValue(12345),
	};
	const bufferService = {
		addToBuffer: jest.fn<any>(),
		addGeoCheckToBuffer: jest.fn<any>(),
		scheduleNextFlush: jest.fn<any>(),
		flushBuffer: jest.fn<any>().mockResolvedValue(undefined),
		flushGeoBuffer: jest.fn<any>().mockResolvedValue(undefined),
		shutdown: jest.fn<any>().mockResolvedValue(undefined),
	};
	const checkProducer = {
		produce: jest.fn<any>().mockResolvedValue({ status: { status: "up" }, check: { id: "c1" } }),
	};
	const checkEvaluator = {
		evaluate: jest.fn<any>().mockResolvedValue({ monitor: makeMonitor(), statusChange: { monitor: makeMonitor() }, decision: {} }),
	};
	const geoCheckPipeline = { run: jest.fn<any>().mockResolvedValue(null) };
	const dispatcher = { dispatch: jest.fn<any>().mockResolvedValue(undefined) };
	const helper = {
		getCleanupOrphanedJob: jest.fn<any>().mockReturnValue(jest.fn<any>().mockResolvedValue(undefined)),
		getCleanupRetentionJob: jest.fn<any>().mockReturnValue(jest.fn<any>().mockResolvedValue(undefined)),
	};
	const queueWorkersRepository = {
		upsert: jest.fn<any>().mockResolvedValue(undefined),
		deleteById: jest.fn<any>().mockResolvedValue(undefined),
		findRecent: jest.fn<any>().mockResolvedValue([]),
	};
	const logger = createMockLogger();
	const isDbConnected = jest.fn<any>(() => true);

	const mocks = {
		isDbConnected,
		jobsRepository,
		monitorsRepository,
		checksRepository,
		checkService,
		bufferService,
		checkProducer,
		checkEvaluator,
		geoCheckPipeline,
		dispatcher,
		helper,
		queueWorkersRepository,
		logger,
		...overrides?.mocks,
	};

	const worker = new DBQueueWorker({
		...mocks,
		queueMode: overrides?.queueMode ?? "worker",
		queuePrimaryProcesses: overrides?.queuePrimaryProcesses ?? true,
		workerId: "worker-1",
	} as any);
	return { worker, mocks };
};

describe("DBQueueWorker", () => {
	let active: DBQueueWorker | null = null;

	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(async () => {
		if (active) await active.shutdown();
		active = null;
		jest.clearAllTimers();
		jest.useRealTimers();
	});

	const start = async (opts?: Parameters<typeof createWorker>[0]) => {
		const ctx = createWorker(opts);
		active = ctx.worker;
		await ctx.worker.init();
		await jest.advanceTimersByTimeAsync(1); // flush the immediate tick + any job it launched
		return ctx;
	};

	// ── init() wiring ─────────────────────────────────────────────────────────

	describe("init", () => {
		it("registers the worker in the heartbeat registry on startup", async () => {
			const { mocks } = await start({ queueMode: "worker" });
			expect(mocks.queueWorkersRepository.upsert).toHaveBeenCalledWith("worker-1", "worker", true);
		});

		it("primary mode reconciles: seeds a check row per monitor plus the two cleanup rows", async () => {
			const { mocks } = await start({
				queueMode: "primary",
				queuePrimaryProcesses: false, // isolate reconcile from the polling loops
				mocks: {
					monitorsRepository: { findByIds: jest.fn<any>(), findAll: jest.fn<any>().mockResolvedValue([makeMonitor()]), updateById: jest.fn<any>() },
				},
			});

			const seededTypes = mocks.jobsRepository.upsertJob.mock.calls.map((c: any[]) => c[0].type);
			expect(seededTypes).toContain("check");
			const cleanupTypes = mocks.jobsRepository.upsertCleanupJob.mock.calls.map((c: any[]) => c[0].type);
			expect(cleanupTypes).toContain("cleanup-orphaned");
			expect(cleanupTypes).toContain("cleanup-retention");
		});

		it("primary mode also seeds a geo-check row for geo-enabled monitors", async () => {
			const geoMonitor = makeMonitor({ type: "http", geoCheckEnabled: true });
			const { mocks } = await start({
				queueMode: "primary",
				queuePrimaryProcesses: false,
				mocks: {
					monitorsRepository: { findByIds: jest.fn<any>(), findAll: jest.fn<any>().mockResolvedValue([geoMonitor]), updateById: jest.fn<any>() },
				},
			});

			const seededTypes = mocks.jobsRepository.upsertJob.mock.calls.map((c: any[]) => c[0].type);
			expect(seededTypes).toContain("geo-check");
		});

		it("worker mode does not reconcile (never seeds jobs)", async () => {
			const { mocks } = await start({ queueMode: "worker" });
			expect(mocks.jobsRepository.upsertJob).not.toHaveBeenCalled();
			expect(mocks.jobsRepository.upsertCleanupJob).not.toHaveBeenCalled();
		});

		it("starts a polling loop per job type, each claiming up to its concurrency cap", async () => {
			const { mocks } = await start({ queueMode: "worker" });

			const claimedTypes = mocks.jobsRepository.claimDueBatch.mock.calls.map((c: any[]) => c[0]);
			expect(claimedTypes).toEqual(expect.arrayContaining(["check", "geo-check", "evaluate", "cleanup-orphaned", "cleanup-retention"]));
			expect(mocks.jobsRepository.claimDueBatch).toHaveBeenCalledWith("check", 500, expect.any(Number));
			expect(mocks.jobsRepository.claimDueBatch).toHaveBeenCalledWith("evaluate", 20, expect.any(Number));
			expect(mocks.jobsRepository.claimDueBatch).toHaveBeenCalledWith("cleanup-orphaned", 1, expect.any(Number));
		});

		it("does not start polling loops when primary and queuePrimaryProcesses is false", async () => {
			const { mocks } = await start({ queueMode: "primary", queuePrimaryProcesses: false });
			expect(mocks.jobsRepository.claimDueBatch).not.toHaveBeenCalled();
		});

		it("create() constructs the worker and runs init", async () => {
			const { mocks } = createWorker(); // reuse the mock set; the un-init'd instance is discarded
			const worker = await DBQueueWorker.create({
				...mocks,
				queueMode: "worker",
				queuePrimaryProcesses: true,
				workerId: "worker-1",
			} as any);
			active = worker;
			await jest.advanceTimersByTimeAsync(1);

			expect(mocks.queueWorkersRepository.upsert).toHaveBeenCalledWith("worker-1", "worker", true);
		});
	});

	// ── runJob: the per-type execution paths ────────────────────────────────────

	describe("runJob", () => {
		// Hand the "check" loop exactly one job, then nothing, so the assertion target runs once.
		const claimOnce = (job: Job) => {
			let handed = false;
			return jest.fn<any>(async (type: string) => {
				if (type === job.type && !handed) {
					handed = true;
					return [job];
				}
				return [];
			});
		};

		it("runs a check job and reschedules it on success", async () => {
			const job = makeJob({ type: "check", refId: "m1", intervalMs: 60000 });
			const { mocks } = await start({ mocks: { jobsRepository: { ...createWorker().mocks.jobsRepository, claimDueBatch: claimOnce(job) } } });

			expect(mocks.monitorsRepository.findByIdLean).toHaveBeenCalledWith("m1");
			expect(mocks.checkProducer.produce).toHaveBeenCalled();
			// The check stage only produces; the buffer arms evaluate once the check is durably stored
			expect(mocks.jobsRepository.upsertEvaluate).not.toHaveBeenCalled();
			expect(mocks.jobsRepository.recordSuccess).toHaveBeenCalledWith(job.id, job.nextScheduledAt, job.intervalMs, expect.any(Number));
			expect(mocks.jobsRepository.recordFailure).not.toHaveBeenCalled();
		});

		it("records a failure (and not a success) when the job handler throws", async () => {
			const job = makeJob({ type: "check" });
			const failingProducer = { produce: jest.fn<any>().mockRejectedValue(new Error("network down")) };
			const { mocks } = await start({
				mocks: { jobsRepository: { ...createWorker().mocks.jobsRepository, claimDueBatch: claimOnce(job) }, checkProducer: failingProducer },
			});

			expect(mocks.jobsRepository.recordFailure).toHaveBeenCalledWith(job.id, expect.any(Error), expect.any(Number));
			expect(mocks.jobsRepository.recordSuccess).not.toHaveBeenCalled();
		});

		// Regression for the "worker crashes on a Mongo blip" bug: recordFailure is the last write in a
		// job's lifecycle. During a Mongo outage it rejects, and on master that rejection escaped runJob →
		// unhandledRejection → the whole worker exited (bypassing graceful drain). It must be swallowed.
		it("does not propagate when recordFailure itself rejects (transient Mongo failure)", async () => {
			const unhandled: unknown[] = [];
			const onUnhandled = (reason: unknown) => unhandled.push(reason);
			process.on("unhandledRejection", onUnhandled);
			try {
				const job = makeJob({ type: "check" });
				const failingProducer = { produce: jest.fn<any>().mockRejectedValue(new Error("network down")) };
				const { mocks, worker } = await start({
					mocks: {
						jobsRepository: {
							...createWorker().mocks.jobsRepository,
							claimDueBatch: claimOnce(job),
							recordFailure: jest.fn<any>().mockRejectedValue(new Error("mongo unavailable")),
						},
						checkProducer: failingProducer,
					},
				});
				await jest.advanceTimersByTimeAsync(1); // let the recordFailure rejection settle

				// the failing failure-write is caught and logged, not thrown
				expect(mocks.jobsRepository.recordFailure).toHaveBeenCalledWith(job.id, expect.any(Error), expect.any(Number));
				expect(mocks.logger.error).toHaveBeenCalledWith(
					expect.objectContaining({ message: expect.stringContaining("recordFailure failed for job check:m1") })
				);
				expect(unhandled).toEqual([]); // nothing escaped to the process
				expect(worker.getHealth().inFlight).toBe(0); // slot freed despite the double failure
			} finally {
				process.off("unhandledRejection", onUnhandled);
			}
		});

		it("swallows the failure when both the success and failure writes reject", async () => {
			const job = makeJob({ type: "check", intervalMs: 60000 }); // produce succeeds → recordSuccess path
			const { mocks, worker } = await start({
				mocks: {
					jobsRepository: {
						...createWorker().mocks.jobsRepository,
						claimDueBatch: claimOnce(job),
						recordSuccess: jest.fn<any>().mockRejectedValue(new Error("mongo unavailable")),
						recordFailure: jest.fn<any>().mockRejectedValue(new Error("mongo still unavailable")),
					},
				},
			});
			await jest.advanceTimersByTimeAsync(1);

			// success write is attempted, its rejection falls into the catch, and the failure write is too
			expect(mocks.jobsRepository.recordSuccess).toHaveBeenCalled();
			expect(mocks.jobsRepository.recordFailure).toHaveBeenCalledWith(job.id, expect.any(Error), expect.any(Number));
			expect(mocks.logger.error).toHaveBeenCalledWith(
				expect.objectContaining({ message: expect.stringContaining("recordFailure failed for job check:m1") })
			);
			expect(worker.getHealth().inFlight).toBe(0);
		});

		it("frees the concurrency slot and keeps polling after a job's completion writes fail", async () => {
			const job = makeJob({ type: "check" });
			const { mocks, worker } = await start({
				mocks: {
					jobsRepository: {
						...createWorker().mocks.jobsRepository,
						claimDueBatch: claimOnce(job),
						recordFailure: jest.fn<any>().mockRejectedValue(new Error("mongo unavailable")),
					},
					checkProducer: { produce: jest.fn<any>().mockRejectedValue(new Error("network down")) },
				},
			});
			await jest.advanceTimersByTimeAsync(1);
			expect(worker.getHealth().inFlight).toBe(0); // slot released via .finally

			const claimsBefore = mocks.jobsRepository.claimDueBatch.mock.calls.length;
			await jest.advanceTimersByTimeAsync(POLL_MS); // the loop re-arms and keeps claiming — not wedged
			expect(mocks.jobsRepository.claimDueBatch.mock.calls.length).toBeGreaterThan(claimsBefore);
		});

		it("parks a one-shot job (intervalMs null) via recordOneShot instead of rescheduling", async () => {
			const job = makeJob({ id: "evaluate:m1", type: "evaluate", intervalMs: null });
			const { mocks } = await start({ mocks: { jobsRepository: { ...createWorker().mocks.jobsRepository, claimDueBatch: claimOnce(job) } } });

			expect(mocks.jobsRepository.recordOneShot).toHaveBeenCalledWith(job.id, expect.any(Number));
			expect(mocks.jobsRepository.recordSuccess).not.toHaveBeenCalled();
		});

		it("evaluate job dispatches each unevaluated check and advances lastEvaluatedAt", async () => {
			const job = makeJob({ id: "evaluate:m1", type: "evaluate", intervalMs: null });
			const checksRepository = { findUnevaluatedByMonitorId: jest.fn<any>().mockResolvedValue([{ id: "c1" }]) };
			const { mocks } = await start({
				mocks: { jobsRepository: { ...createWorker().mocks.jobsRepository, claimDueBatch: claimOnce(job) }, checksRepository },
			});

			expect(mocks.checkEvaluator.evaluate).toHaveBeenCalled();
			expect(mocks.dispatcher.dispatch).toHaveBeenCalled();
			expect(mocks.monitorsRepository.updateById).toHaveBeenCalledWith("m1", "team", { lastEvaluatedAt: 12345 });
		});

		it("evaluate job reads the monitor once and threads the post-write monitor across the backlog", async () => {
			const job = makeJob({ id: "evaluate:m1", type: "evaluate", intervalMs: null });
			const initialMonitor = makeMonitor();
			const postWriteMonitor = makeMonitor({ status: "down" }); // what updateStatusWindowAndChecks would return after check c1
			const monitorsRepository = {
				findByIdLean: jest.fn<any>().mockResolvedValue(initialMonitor),
				updateById: jest.fn<any>().mockResolvedValue({}),
			};
			const checksRepository = { findUnevaluatedByMonitorId: jest.fn<any>().mockResolvedValue([{ id: "c1" }, { id: "c2" }]) };
			const checkEvaluator = {
				evaluate: jest.fn<any>().mockResolvedValue({ monitor: postWriteMonitor, statusChange: { monitor: postWriteMonitor }, decision: {} }),
			};
			const { mocks } = await start({
				mocks: {
					jobsRepository: { ...createWorker().mocks.jobsRepository, claimDueBatch: claimOnce(job) },
					monitorsRepository,
					checksRepository,
					checkEvaluator,
				},
			});

			// The monitor is read once for the whole backlog, not once per check
			expect(mocks.monitorsRepository.findByIdLean).toHaveBeenCalledTimes(1);
			expect(mocks.checkEvaluator.evaluate).toHaveBeenCalledTimes(2);
			// First check evaluates against the freshly-read monitor; the second against the post-write monitor from the first
			expect(mocks.checkEvaluator.evaluate.mock.calls[0][2]).toBe(initialMonitor);
			expect(mocks.checkEvaluator.evaluate.mock.calls[1][2]).toBe(postWriteMonitor);
		});

		it("cleanup-orphaned job runs the helper's cleanup function", async () => {
			const job = makeJob({ id: "cleanup-orphaned", type: "cleanup-orphaned", refId: null, intervalMs: 86400000 });
			const cleanupFn = jest.fn<any>().mockResolvedValue(undefined);
			const helper = {
				getCleanupOrphanedJob: jest.fn<any>().mockReturnValue(cleanupFn),
				getCleanupRetentionJob: jest.fn<any>().mockReturnValue(jest.fn<any>().mockResolvedValue(undefined)),
			};
			await start({ mocks: { jobsRepository: { ...createWorker().mocks.jobsRepository, claimDueBatch: claimOnce(job) }, helper } });

			expect(cleanupFn).toHaveBeenCalled();
		});

		it("cleanup-retention job runs the helper's retention function", async () => {
			const job = makeJob({ id: "cleanup-retention", type: "cleanup-retention", refId: null, intervalMs: 86400000 });
			const retentionFn = jest.fn<any>().mockResolvedValue(undefined);
			const helper = {
				getCleanupOrphanedJob: jest.fn<any>().mockReturnValue(jest.fn<any>().mockResolvedValue(undefined)),
				getCleanupRetentionJob: jest.fn<any>().mockReturnValue(retentionFn),
			};
			await start({ mocks: { jobsRepository: { ...createWorker().mocks.jobsRepository, claimDueBatch: claimOnce(job) }, helper } });

			expect(retentionFn).toHaveBeenCalled();
		});

		it("geo-check job runs the geo pipeline (no evaluate handoff)", async () => {
			const job = makeJob({ id: "geo-check:m1", type: "geo-check", refId: "m1", intervalMs: 300000 });
			const { mocks } = await start({ mocks: { jobsRepository: { ...createWorker().mocks.jobsRepository, claimDueBatch: claimOnce(job) } } });

			expect(mocks.geoCheckPipeline.run).toHaveBeenCalled();
			expect(mocks.dispatcher.dispatch).not.toHaveBeenCalled();
			expect(mocks.jobsRepository.recordSuccess).toHaveBeenCalledWith(job.id, job.nextScheduledAt, job.intervalMs, expect.any(Number));
		});

		it("renews the lock while a slow job is still running", async () => {
			const job = makeJob({ type: "check" });
			const gate = deferred<{ status: unknown; check: unknown }>();
			const slowProducer = { produce: jest.fn<any>().mockReturnValue(gate.promise) };
			const { mocks } = await start({
				mocks: { jobsRepository: { ...createWorker().mocks.jobsRepository, claimDueBatch: claimOnce(job) }, checkProducer: slowProducer },
			});

			// Job is parked on produce(); push past one renewal interval.
			await jest.advanceTimersByTimeAsync(LOCK_RENEW_MS);
			expect(mocks.jobsRepository.renewLocks).toHaveBeenCalledWith([job.id], expect.any(Number));

			// Let it finish; success is still recorded.
			gate.resolve({ status: { status: "up" }, check: { id: "c1" } });
			await jest.advanceTimersByTimeAsync(1);
			expect(mocks.jobsRepository.recordSuccess).toHaveBeenCalled();
		});

		it("stops renewing once the lock is lost to another worker", async () => {
			const job = makeJob({ type: "check" });
			const gate = deferred<{ status: unknown; check: unknown }>();
			const slowProducer = { produce: jest.fn<any>().mockReturnValue(gate.promise) };
			const jobsRepository = {
				...createWorker().mocks.jobsRepository,
				claimDueBatch: claimOnce(job),
				renewLocks: jest.fn<any>().mockResolvedValue(0),
			};
			const { mocks } = await start({ mocks: { jobsRepository, checkProducer: slowProducer } });

			await jest.advanceTimersByTimeAsync(LOCK_RENEW_MS);
			expect(mocks.jobsRepository.renewLocks).toHaveBeenCalledTimes(1); // lease lost → renewal timer stops
			expect(mocks.logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("Lost lock") }));

			// A second interval passes without another renewal attempt.
			await jest.advanceTimersByTimeAsync(LOCK_RENEW_MS);
			expect(mocks.jobsRepository.renewLocks).toHaveBeenCalledTimes(1);

			gate.resolve({ status: { status: "up" }, check: { id: "c1" } });
			await jest.advanceTimersByTimeAsync(1);
		});
	});

	// ── monitor lifecycle delegation ────────────────────────────────────────────

	describe("job lifecycle methods", () => {
		it("addJob seeds a check row, plus a geo row for geo-enabled monitors", async () => {
			const { worker, mocks } = createWorker();
			active = worker;
			await worker.addJob("m1", makeMonitor({ geoCheckEnabled: true }));

			const types = mocks.jobsRepository.upsertJob.mock.calls.map((c: any[]) => c[0].type);
			expect(types).toContain("check");
			expect(types).toContain("geo-check");
		});

		it("addJob schedules new jobs to run immediately (no startup jitter)", async () => {
			const { worker, mocks } = createWorker();
			active = worker;
			const now = Date.now();
			await worker.addJob("m1", makeMonitor({ geoCheckEnabled: true }));

			for (const [seed] of mocks.jobsRepository.upsertJob.mock.calls as any[][]) {
				expect(seed.nextScheduledAt).toBe(now);
			}
		});

		it("addJob seeds only a check row for non-geo monitors", async () => {
			const { worker, mocks } = createWorker();
			active = worker;
			await worker.addJob("m1", makeMonitor({ geoCheckEnabled: false }));

			const types = mocks.jobsRepository.upsertJob.mock.calls.map((c: any[]) => c[0].type);
			expect(types).toEqual(["check"]);
		});

		it("deleteJob removes every row for the monitor", async () => {
			const { worker, mocks } = createWorker();
			active = worker;
			await worker.deleteJob(makeMonitor());
			expect(mocks.jobsRepository.deleteById).toHaveBeenCalledWith("m1");
		});

		it("pauseJob and resumeJob flip the active flag", async () => {
			const { worker, mocks } = createWorker();
			active = worker;
			await worker.pauseJob(makeMonitor());
			expect(mocks.jobsRepository.setActiveById).toHaveBeenCalledWith("m1", false);
			await worker.resumeJob(makeMonitor());
			expect(mocks.jobsRepository.setActiveById).toHaveBeenCalledWith("m1", true);
		});

		it("updateJob reschedules the check row and drops the geo row when geo is disabled", async () => {
			const { worker, mocks } = createWorker();
			active = worker;
			await worker.updateJob(makeMonitor({ geoCheckEnabled: false, interval: 30000 }));
			expect(mocks.jobsRepository.updateScheduleById).toHaveBeenCalledWith("m1", "check", 30000);
			expect(mocks.jobsRepository.deleteByIdAndType).toHaveBeenCalledWith("m1", "geo-check");
		});

		it("updateJob upserts the geo row when geo is enabled", async () => {
			const { worker, mocks } = createWorker();
			active = worker;
			await worker.updateJob(makeMonitor({ geoCheckEnabled: true }));
			const types = mocks.jobsRepository.upsertJob.mock.calls.map((c: any[]) => c[0].type);
			expect(types).toContain("geo-check");
			expect(mocks.jobsRepository.deleteByIdAndType).not.toHaveBeenCalled();
		});
	});

	// ── poll backoff + wake() ───────────────────────────────────────────────────
	//
	// An idle loop grows its poll interval up to POLL_MAX_MS (5s). wake() fast-paths
	// it back so a freshly-enqueued "run now" job doesn't wait out that backoff.

	describe("poll backoff and wake", () => {
		const POLL_MAX_MS = 5000;
		const claims = (mocks: any, type: string) => mocks.jobsRepository.claimDueBatch.mock.calls.filter((c: any[]) => c[0] === type).length;

		it("backs off the idle poll interval toward POLL_MAX_MS", async () => {
			const { mocks } = await start({ queueMode: "worker" }); // claimDueBatch returns [] → always idle
			await jest.advanceTimersByTimeAsync(15000); // let the check loop grow to the cap
			const before = claims(mocks, "check");
			await jest.advanceTimersByTimeAsync(POLL_MAX_MS * 2); // ~2 polls at a 5s cadence
			const delta = claims(mocks, "check") - before;
			// At the cap that's ~2 polls; at the un-backed-off 250ms cadence it would be ~40.
			expect(delta).toBeGreaterThanOrEqual(1);
			expect(delta).toBeLessThanOrEqual(4);
		});

		it("resets the poll interval to POLL_MS once a tick finds work after being idle", async () => {
			let busy = false;
			const claimDueBatch = jest.fn<any>(async (type: string) => (busy && type === "check" ? [makeJob()] : []));
			const { mocks } = await start({ mocks: { jobsRepository: { ...createWorker().mocks.jobsRepository, claimDueBatch } } });

			await jest.advanceTimersByTimeAsync(15000); // idle → backed off to the 5s cap
			busy = true;
			await jest.advanceTimersByTimeAsync(POLL_MAX_MS); // the next (backed-off) tick fires, finds work → resets pollMs to POLL_MS
			const before = claims(mocks, "check");

			await jest.advanceTimersByTimeAsync(POLL_MS * 2); // 500ms

			// Polling fast again (~2 in 500ms), not once per 5s — proves the interval reset on finding work.
			expect(claims(mocks, "check") - before).toBeGreaterThanOrEqual(1);
		});

		it("does not back off a loop that is at capacity (capacity === 0)", async () => {
			// cleanup-orphaned has concurrency 1; hold its one job in-flight so capacity stays 0.
			// The backoff condition is `capacity > 0 && jobs.length === 0`, so an at-capacity loop
			// must keep polling at POLL_MS (a freed slot should be picked up promptly, not after 5s).
			const gate = deferred<void>();
			let handed = false;
			const claimDueBatch = jest.fn<any>(async (type: string) => {
				if (type === "cleanup-orphaned" && !handed) {
					handed = true;
					return [makeJob({ id: "cleanup-orphaned", type: "cleanup-orphaned", refId: null, intervalMs: 86400000 })];
				}
				return [];
			});
			const helper = {
				getCleanupOrphanedJob: jest.fn<any>().mockReturnValue(jest.fn<any>(() => gate.promise)), // blocks → keeps the slot full
				getCleanupRetentionJob: jest.fn<any>().mockReturnValue(jest.fn<any>().mockResolvedValue(undefined)),
			};
			const { mocks } = await start({ mocks: { jobsRepository: { ...createWorker().mocks.jobsRepository, claimDueBatch }, helper } });

			const before = claims(mocks, "cleanup-orphaned"); // the blocking job is now in-flight → capacity 0
			await jest.advanceTimersByTimeAsync(1000);
			const delta = claims(mocks, "cleanup-orphaned") - before;

			// ~4 polls at POLL_MS; if an at-capacity loop wrongly backed off it would be ~1.
			expect(delta).toBeGreaterThanOrEqual(3);

			gate.resolve();
			await jest.advanceTimersByTimeAsync(1); // let the held job finish for a clean shutdown
		});

		it("wake() re-fires an idle, backed-off loop immediately", async () => {
			const { worker, mocks } = await start({ queueMode: "worker" });
			await jest.advanceTimersByTimeAsync(15000); // back off the check loop to the cap
			const before = claims(mocks, "check");

			worker.wake("check");
			await jest.advanceTimersByTimeAsync(1);

			expect(claims(mocks, "check")).toBe(before + 1); // fired now, not 5s later
		});

		it("wake() resets the cadence so the loop polls fast again, not at the 5s cap", async () => {
			const { worker, mocks } = await start({ queueMode: "worker" });
			await jest.advanceTimersByTimeAsync(15000); // backed off to the cap
			worker.wake("check");
			await jest.advanceTimersByTimeAsync(1); // immediate tick (still idle → next poll at ~POLL_MS*2)
			const before = claims(mocks, "check");

			await jest.advanceTimersByTimeAsync(POLL_MS * 2); // 500ms

			// Polled again well within the old 5s cap, proving the interval was reset.
			expect(claims(mocks, "check")).toBe(before + 1);
		});

		it("wake() is a no-op for a loop that isn't running in this process", async () => {
			const { worker, mocks } = await start({ queueMode: "primary", queuePrimaryProcesses: false }); // no loops
			expect(() => worker.wake("check")).not.toThrow();
			await jest.advanceTimersByTimeAsync(1);
			expect(claims(mocks, "check")).toBe(0);
		});

		it("addJob wakes the check loop so a new monitor's first check runs promptly", async () => {
			const { worker, mocks } = await start({ queueMode: "worker" });
			await jest.advanceTimersByTimeAsync(15000); // backed off to the cap
			const before = claims(mocks, "check");

			await worker.addJob("m2", makeMonitor({ id: "m2" }));
			await jest.advanceTimersByTimeAsync(1);

			expect(claims(mocks, "check")).toBe(before + 1);
		});

		it("resumeJob wakes the check loop so a resumed monitor runs promptly", async () => {
			const { worker, mocks } = await start({ queueMode: "worker" });
			await jest.advanceTimersByTimeAsync(15000); // backed off to the cap
			const before = claims(mocks, "check");

			await worker.resumeJob(makeMonitor());
			await jest.advanceTimersByTimeAsync(1);

			expect(claims(mocks, "check")).toBe(before + 1);
		});
	});

	// ── shutdown ────────────────────────────────────────────────────────────────

	describe("shutdown", () => {
		it("deregisters the worker and stops the polling loops", async () => {
			const { worker, mocks } = createWorker({ queueMode: "worker" });
			await worker.init();
			await jest.advanceTimersByTimeAsync(1);
			const claimsAfterInit = mocks.jobsRepository.claimDueBatch.mock.calls.length;

			await worker.shutdown();
			expect(mocks.queueWorkersRepository.deleteById).toHaveBeenCalledWith("worker-1");

			// Loops must not re-arm after shutdown.
			await jest.advanceTimersByTimeAsync(POLL_MS * 4);
			expect(mocks.jobsRepository.claimDueBatch.mock.calls.length).toBe(claimsAfterInit);
			// already shut down; keep afterEach from double-shutting-down
			active = null;
		});
	});

	// ── drain ─────────────────────────────────────────────────────────────────────

	describe("drain", () => {
		// Hand the "check" loop exactly one job, then nothing.
		const claimOnce = (job: Job) => {
			let handed = false;
			return jest.fn<any>(async (type: string) => {
				if (type === job.type && !handed) {
					handed = true;
					return [job];
				}
				return [];
			});
		};

		it("stops the loops and flushes the buffer when nothing is in flight", async () => {
			const { worker, mocks } = await start({ queueMode: "worker" });
			const claimsBefore = mocks.jobsRepository.claimDueBatch.mock.calls.length;

			await worker.drain();

			expect(mocks.bufferService.shutdown).toHaveBeenCalledTimes(1);
			expect(mocks.logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("drained") }));
			// Loops must not claim again after draining.
			await jest.advanceTimersByTimeAsync(POLL_MS * 4);
			expect(mocks.jobsRepository.claimDueBatch.mock.calls.length).toBe(claimsBefore);
		});

		it("waits for an in-flight job to finish before flushing", async () => {
			const job = makeJob({ type: "check" });
			const gate = deferred<{ status: unknown; check: unknown }>();
			const slowProducer = { produce: jest.fn<any>().mockReturnValue(gate.promise) };
			const { worker, mocks } = await start({
				mocks: { jobsRepository: { ...createWorker().mocks.jobsRepository, claimDueBatch: claimOnce(job) }, checkProducer: slowProducer },
			});

			// Job is parked on produce(); drain must not flush while it is still in flight.
			const draining = worker.drain();
			await jest.advanceTimersByTimeAsync(DRAIN_POLL_MS * 3);
			expect(mocks.bufferService.shutdown).not.toHaveBeenCalled();

			// Let the job finish; drain observes inFlight == 0, then flushes.
			gate.resolve({ status: { status: "up" }, check: { id: "c1" } });
			await jest.advanceTimersByTimeAsync(DRAIN_POLL_MS);
			await draining;
			expect(mocks.bufferService.shutdown).toHaveBeenCalledTimes(1);
		});

		it("times out after DRAIN_TIMEOUT_MS, warns, and still flushes", async () => {
			const job = makeJob({ type: "check" });
			const gate = deferred<{ status: unknown; check: unknown }>();
			const stuckProducer = { produce: jest.fn<any>().mockReturnValue(gate.promise) };
			const { worker, mocks } = await start({
				mocks: { jobsRepository: { ...createWorker().mocks.jobsRepository, claimDueBatch: claimOnce(job) }, checkProducer: stuckProducer },
			});

			const draining = worker.drain();
			await jest.advanceTimersByTimeAsync(DRAIN_TIMEOUT_MS + DRAIN_POLL_MS);
			await draining;

			expect(mocks.logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("timed out") }));
			expect(mocks.bufferService.shutdown).toHaveBeenCalledTimes(1);

			gate.resolve({ status: { status: "up" }, check: { id: "c1" } }); // release the stuck job for cleanup
		});
	});

	// ── getHealth ───────────────────────────────────────────────────────────────────

	describe("getHealth", () => {
		// Hand the "check" loop exactly one job, then nothing — keeps it parked in-flight.
		const claimOneCheck = (job: Job) => {
			let handed = false;
			return jest.fn<any>(async (type: string) => {
				if (type === job.type && !handed) {
					handed = true;
					return [job];
				}
				return [];
			});
		};

		it("reports un-init state before init(): not complete, not draining, never ticked", () => {
			const { worker } = createWorker({ queueMode: "worker" });
			active = worker; // afterEach shutdown() is safe on an un-init'd worker
			expect(worker.getHealth()).toMatchObject({
				workerId: "worker-1",
				mode: "worker",
				initComplete: false,
				draining: false,
				lastTickAt: null,
				inFlight: 0,
			});
		});

		it("flips initComplete and stamps lastTickAt once the loops run", async () => {
			const { worker } = await start({ queueMode: "worker" });
			const health = worker.getHealth();
			expect(health.initComplete).toBe(true);
			expect(typeof health.lastTickAt).toBe("number");
		});

		it("reflects the injected dbConnected probe", async () => {
			const { worker, mocks } = await start({ queueMode: "worker" });
			expect(worker.getHealth().dbConnected).toBe(true);
			mocks.isDbConnected.mockReturnValue(false);
			expect(worker.getHealth().dbConnected).toBe(false);
		});

		it("sets draining true after drain()", async () => {
			const { worker } = await start({ queueMode: "worker" });
			expect(worker.getHealth().draining).toBe(false);
			await worker.drain();
			expect(worker.getHealth().draining).toBe(true);
		});

		it("counts in-flight jobs while they run and releases on completion", async () => {
			const job = makeJob({ type: "check" });
			const gate = deferred<{ status: unknown; check: unknown }>();
			const slowProducer = { produce: jest.fn<any>().mockReturnValue(gate.promise) };
			const { worker } = await start({
				mocks: { jobsRepository: { ...createWorker().mocks.jobsRepository, claimDueBatch: claimOneCheck(job) }, checkProducer: slowProducer },
			});

			expect(worker.getHealth().inFlight).toBe(1); // parked on produce()

			gate.resolve({ status: { status: "up" }, check: { id: "c1" } });
			await jest.advanceTimersByTimeAsync(1);
			expect(worker.getHealth().inFlight).toBe(0);
		});
	});

	// ── metrics accessors ───────────────────────────────────────────────────────────

	describe("metrics accessors", () => {
		it("countDueBacklog delegates to the repo with the current time", async () => {
			const { worker, mocks } = await start({ queueMode: "worker" });
			mocks.jobsRepository.countDueBacklog.mockResolvedValue(7);

			expect(await worker.countDueBacklog()).toBe(7);
			expect(mocks.jobsRepository.countDueBacklog).toHaveBeenCalledWith(expect.any(Number));
		});

		it("countAliveWorkers counts only recently-seen nodes that process jobs", async () => {
			const { worker, mocks } = await start({ queueMode: "worker" });
			mocks.queueWorkersRepository.findRecent.mockResolvedValue([
				{ processesJobs: true },
				{ processesJobs: true },
				{ processesJobs: false }, // scheduler-only primary: alive but not a processor
			]);

			expect(await worker.countAliveWorkers()).toBe(2);
		});
	});

	// ── flushQueues ───────────────────────────────────────────────────────────────

	describe("flushQueues", () => {
		it("restarts the worker and reports success", async () => {
			const { worker, mocks } = createWorker({ queueMode: "worker" });
			active = worker;
			await worker.init();
			await jest.advanceTimersByTimeAsync(1);

			const result = await worker.flushQueues();
			await jest.advanceTimersByTimeAsync(1);

			expect(result).toEqual({ success: true });
			expect(mocks.queueWorkersRepository.deleteById).toHaveBeenCalledWith("worker-1"); // shutdown leg
			expect(mocks.queueWorkersRepository.upsert).toHaveBeenCalledTimes(2); // init + re-init
		});
	});

	// ── getMetrics ──────────────────────────────────────────────────────────────

	describe("getMetrics", () => {
		it("aggregates run/fail counts, active leases, and failing jobs across all rows", async () => {
			const now = Date.now();
			const rows = [
				makeJob({ id: "a", runCount: 5, failCount: 0, lockedBy: "w", lockedUntil: now + 10000 }), // active lease
				makeJob({ id: "b", runCount: 2, failCount: 3, lastFailReason: "boom", lockedBy: null, lockedUntil: null }), // failing
				makeJob({ id: "c", runCount: 1, failCount: 0, lockedBy: "w", lockedUntil: now - 10000 }), // expired lease, not active
			];
			const { worker, mocks } = createWorker();
			active = worker;
			mocks.jobsRepository.findAll.mockResolvedValue(rows);
			mocks.queueWorkersRepository.findRecent.mockResolvedValue([
				{ workerId: "w", processesJobs: true },
				{ workerId: "scheduler", processesJobs: false }, // scheduler-only primary excluded from metrics
			]);

			const metrics = await worker.getMetrics();

			expect(metrics.jobs).toBe(3);
			expect(metrics.totalRuns).toBe(8);
			expect(metrics.totalFailures).toBe(3);
			expect(metrics.activeJobs).toBe(1);
			expect(metrics.failingJobs).toBe(1);
			expect(metrics.jobsWithFailures).toHaveLength(1);
			expect(metrics.jobsWithFailures[0]).toEqual(expect.objectContaining({ failCount: 3, failReason: "boom" }));
			expect(metrics.workers).toEqual([{ workerId: "w", processesJobs: true }]);
		});
	});

	// ── getJobs ─────────────────────────────────────────────────────────────────

	describe("getJobs", () => {
		it("maps rows to summaries and passes the total count through", async () => {
			const { worker, mocks } = createWorker();
			active = worker;
			mocks.jobsRepository.findPage.mockResolvedValue({
				jobs: [makeJob({ id: "check:m1", refId: "m1", type: "check", intervalMs: 60000 })],
				count: 1,
			});

			const page = await worker.getJobs({ page: 0, rowsPerPage: 10 });

			expect(page.count).toBe(1);
			expect(page.jobs).toHaveLength(1);
			expect(page.jobs[0]).toEqual(expect.objectContaining({ monitorId: "m1", monitorType: "check", monitorInterval: 60000 }));
		});

		it("falls back to the job id for monitorId when refId is null (global jobs)", async () => {
			const { worker, mocks } = createWorker();
			active = worker;
			mocks.jobsRepository.findPage.mockResolvedValue({
				jobs: [makeJob({ id: "cleanup-orphaned", refId: null, type: "cleanup-orphaned" })],
				count: 1,
			});

			const page = await worker.getJobs({ page: 0, rowsPerPage: 10 });
			expect(page.jobs[0].monitorId).toBe("cleanup-orphaned");
		});
	});
});
