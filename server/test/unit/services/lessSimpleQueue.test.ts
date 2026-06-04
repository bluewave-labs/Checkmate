import { describe, expect, it, jest } from "@jest/globals";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import type { Monitor } from "../../../src/types/monitor.ts";

// ── Mock Scheduler / MongoStore ──────────────────────────────────────────────

const createScheduler = () => {
	const listeners: Record<string, Function[]> = {};
	return {
		workerId: "host-1:1234:abcd",
		on: jest.fn((event: string, cb: Function) => {
			listeners[event] = listeners[event] || [];
			listeners[event].push(cb);
		}),
		off: jest.fn((event: string, cb: Function) => {
			listeners[event] = (listeners[event] || []).filter((fn) => fn !== cb);
		}),
		emit: (event: string, ...args: unknown[]) => {
			(listeners[event] || []).forEach((cb) => cb(...args));
		},
		start: jest.fn().mockResolvedValue(true),
		stop: jest.fn().mockResolvedValue(true),
		addTemplate: jest.fn(),
		addJob: jest.fn(),
		addJobs: jest.fn().mockResolvedValue({ inserted: 0, upserted: 0, modified: 0, failures: [] }),
		removeJob: jest.fn(),
		getJob: jest.fn().mockResolvedValue(null),
		getJobs: jest.fn().mockResolvedValue([]),
		countJobs: jest.fn().mockResolvedValue(0),
		getStats: jest.fn().mockResolvedValue({ jobs: 0, activeJobs: 0, failingJobs: 0, totalRuns: 0, totalFailures: 0, jobsWithFailures: [] }),
		pauseJob: jest.fn().mockResolvedValue(true),
		resumeJob: jest.fn().mockResolvedValue(true),
		updateJob: jest.fn(),
		flushJobs: jest.fn().mockResolvedValue(true),
	};
};

const mockSchedulerInstance = createScheduler();
const MockScheduler = jest.fn().mockReturnValue(mockSchedulerInstance);
const MockMongoStore = jest.fn();

jest.unstable_mockModule("less-simple-scheduler", () => ({
	Scheduler: MockScheduler,
	MongoStore: MockMongoStore,
}));

const { LessSimpleQueue } = await import("../../../src/service/infrastructure/JobQueues/LessSimpleQueue.ts");

const createQueueHelper = () => ({
	getHeartbeatJob: jest.fn().mockReturnValue(() => Promise.resolve()),
	getHeartbeatGeoJob: jest.fn().mockReturnValue(() => Promise.resolve()),
	getCleanupOrphanedJob: jest.fn().mockReturnValue(() => Promise.resolve()),
	getCleanupRetentionJob: jest.fn().mockReturnValue(() => Promise.resolve()),
});

const createMonitorsRepo = () => ({
	findAll: jest.fn().mockResolvedValue([]),
});

const createWorkersRepo = () => ({
	upsert: jest.fn().mockResolvedValue(undefined),
	findRecent: jest.fn().mockResolvedValue([]),
	deleteById: jest.fn().mockResolvedValue(undefined),
});

const createQueue = (overrides?: Record<string, unknown>) => {
	const logger = createMockLogger();
	const helper = createQueueHelper();
	const monitorsRepository = createMonitorsRepo();
	const workersRepository = createWorkersRepo();
	const scheduler = createScheduler();

	const defaults = { logger, helper, monitorsRepository, workersRepository, scheduler, queueMode: "primary", ...overrides };

	const queue = new LessSimpleQueue(
		defaults.logger as any,
		defaults.helper as any,
		defaults.monitorsRepository as any,
		defaults.workersRepository as any,
		defaults.scheduler as any,
		defaults.queueMode as any
	);
	return { queue, ...defaults };
};

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "mon-1",
		teamId: "team-1",
		type: "http",
		interval: 60000,
		isActive: true,
		geoCheckEnabled: false,
		geoCheckInterval: 300000,
		geoCheckLocations: [],
		...overrides,
	}) as Monitor;

// ── Tests ────────────────────────────────────────────────────────────────────

describe("LessSimpleQueue", () => {
	describe("serviceName", () => {
		it("returns JobQueue", () => {
			const { queue } = createQueue();
			expect(queue.serviceName).toBe("JobQueue");
		});
	});

	// ── init (primary) ─────────────────────────────────────────────────────────

	describe("init - primary mode", () => {
		it("starts scheduler, registers all templates, seeds monitors and system jobs", async () => {
			const { queue, scheduler, monitorsRepository } = createQueue();

			const result = await queue.init();

			expect(result).toBe(true);
			expect(scheduler.start).toHaveBeenCalled();
			expect(scheduler.addTemplate).toHaveBeenCalledWith("monitor-job", expect.any(Function));
			expect(scheduler.addTemplate).toHaveBeenCalledWith("geo-check-job", expect.any(Function));
			expect(scheduler.addTemplate).toHaveBeenCalledWith("cleanup-orphaned", expect.any(Function));
			expect(scheduler.addTemplate).toHaveBeenCalledWith("cleanup-retention-job", expect.any(Function));
			expect(monitorsRepository.findAll).toHaveBeenCalled();
			expect(scheduler.addJob).toHaveBeenCalledWith(expect.objectContaining({ id: "cleanup-orphaned" }));
			expect(scheduler.addJob).toHaveBeenCalledWith(expect.objectContaining({ id: "cleanup-retention" }));
		});

		it("registers existing monitors in a single bulk write", async () => {
			const monitors = [makeMonitor({ id: "m1" }), makeMonitor({ id: "m2" })];
			const { queue, scheduler, monitorsRepository } = createQueue();
			(monitorsRepository.findAll as jest.Mock).mockResolvedValue(monitors);

			await queue.init();

			expect(scheduler.addJobs).toHaveBeenCalledTimes(1);
			expect(scheduler.addJobs).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({ id: "m1", template: "monitor-job", jitter: true }),
					expect.objectContaining({ id: "m2", template: "monitor-job", jitter: true }),
				])
			);
		});

		it("returns true and skips system jobs when findAll returns null", async () => {
			const { queue, monitorsRepository, scheduler } = createQueue();
			(monitorsRepository.findAll as jest.Mock).mockResolvedValue(null);

			const result = await queue.init();

			expect(result).toBe(true);
			expect(scheduler.addJob).not.toHaveBeenCalledWith(expect.objectContaining({ id: "cleanup-orphaned" }));
		});

		it("returns false and logs error on failure", async () => {
			const { queue, logger, monitorsRepository } = createQueue();
			(monitorsRepository.findAll as jest.Mock).mockRejectedValue(new Error("db down"));

			const result = await queue.init();

			expect(result).toBe(false);
			expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("db down") }));
		});

		it("logs error with String(error) for non-Error exceptions", async () => {
			const { queue, logger, monitorsRepository } = createQueue();
			(monitorsRepository.findAll as jest.Mock).mockRejectedValue("string error");

			const result = await queue.init();

			expect(result).toBe(false);
			expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("string error") }));
		});
	});

	// ── init (worker) ──────────────────────────────────────────────────────────

	describe("init - worker mode", () => {
		it("starts scheduler and registers all templates", async () => {
			const { queue, scheduler } = createQueue();

			const result = await queue.init("worker");

			expect(result).toBe(true);
			expect(scheduler.start).toHaveBeenCalled();
			expect(scheduler.addTemplate).toHaveBeenCalledWith("monitor-job", expect.any(Function));
			expect(scheduler.addTemplate).toHaveBeenCalledWith("geo-check-job", expect.any(Function));
			expect(scheduler.addTemplate).toHaveBeenCalledWith("cleanup-orphaned", expect.any(Function));
			expect(scheduler.addTemplate).toHaveBeenCalledWith("cleanup-retention-job", expect.any(Function));
		});

		it("does NOT seed monitor jobs (no findAll, primary populates the queue)", async () => {
			const { queue, monitorsRepository } = createQueue();

			await queue.init("worker");

			expect(monitorsRepository.findAll).not.toHaveBeenCalled();
		});

		it("does NOT seed cleanup system jobs", async () => {
			const { queue, scheduler } = createQueue();

			await queue.init("worker");

			expect(scheduler.addJob).not.toHaveBeenCalledWith(expect.objectContaining({ id: "cleanup-orphaned" }));
			expect(scheduler.addJob).not.toHaveBeenCalledWith(expect.objectContaining({ id: "cleanup-retention" }));
			expect(scheduler.addJob).not.toHaveBeenCalled();
		});

		it("logs the initialized worker with its workerId", async () => {
			const { queue, logger } = createQueue();

			await queue.init("worker");

			expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: "Worker queue: host-1:1234:abcd initialized" }));
		});
	});

	// ── registerListeners ──────────────────────────────────────────────────────

	describe("registerListeners (via constructor)", () => {
		it("logs on scheduler:start", () => {
			const { scheduler, logger } = createQueue();
			scheduler.emit("scheduler:start", "host-1:1234:abcd");
			expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: "Scheduler started" }));
		});

		it("logs on scheduler:stop", () => {
			const { scheduler, logger } = createQueue();
			scheduler.emit("scheduler:stop", "host-1:1234:abcd");
			expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: "Scheduler stopped" }));
		});

		it("logs on scheduler:error with Error", () => {
			const { scheduler, logger } = createQueue();
			scheduler.emit("scheduler:error", "w1", new Error("boom"));
			expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: "w1 error: boom" }));
		});

		it("logs on scheduler:error with non-Error", () => {
			const { scheduler, logger } = createQueue();
			scheduler.emit("scheduler:error", "w1", "string error");
			expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: "w1 error: string error", stack: undefined }));
		});

		it("logs on job:locked", () => {
			const { scheduler, logger } = createQueue();
			scheduler.emit("job:locked", "w1", { id: "m1" });
			expect(logger.debug).toHaveBeenCalledWith(expect.objectContaining({ message: "w1 m1 locked" }));
		});

		it("logs on job:abort", () => {
			const { scheduler, logger } = createQueue();
			scheduler.emit("job:abort", "w1", { id: "m1" }, "timeout");
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: "w1 m1 aborted: timeout" }));
		});

		it("logs on job:attempt", () => {
			const { scheduler, logger } = createQueue();
			scheduler.emit("job:attempt", "w1", { id: "m1" }, 2);
			expect(logger.debug).toHaveBeenCalledWith(expect.objectContaining({ message: "w1 m1 attempt 2" }));
		});

		it("logs on job:complete", () => {
			const { scheduler, logger } = createQueue();
			scheduler.emit("job:complete", "w1", { id: "m1" });
			expect(logger.debug).toHaveBeenCalledWith(expect.objectContaining({ message: "w1 m1 completed successfully" }));
		});

		it("logs on job:exhausted with Error", () => {
			const { scheduler, logger } = createQueue();
			scheduler.emit("job:exhausted", "w1", { id: "m1" }, new Error("gave up"));
			expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: "w1 m1 exhausted all retries: gave up" }));
		});

		it("logs on job:exhausted with non-Error", () => {
			const { scheduler, logger } = createQueue();
			scheduler.emit("job:exhausted", "w1", { id: "m1" }, "gave up");
			expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: "w1 m1 exhausted all retries: gave up", stack: undefined }));
		});

		it("logs on job:fail with Error", () => {
			const { scheduler, logger } = createQueue();
			scheduler.emit("job:fail", "w1", { id: "m1" }, new Error("oops"), 1);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: "w1 m1 failed on attempt 1: oops" }));
		});

		it("logs on job:fail with non-Error", () => {
			const { scheduler, logger } = createQueue();
			scheduler.emit("job:fail", "w1", { id: "m1" }, "oops", 1);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: "w1 m1 failed on attempt 1: oops", stack: undefined }));
		});

		it("logs on job:start", () => {
			const { scheduler, logger } = createQueue();
			scheduler.emit("job:start", "w1", { id: "m1" });
			expect(logger.debug).toHaveBeenCalledWith(expect.objectContaining({ message: "w1 m1 started" }));
		});
	});

	// ── addJob ─────────────────────────────────────────────────────────────────

	describe("addJob", () => {
		it("adds monitor job to scheduler", async () => {
			const { queue, scheduler } = createQueue();
			await queue.addJob("mon-1", makeMonitor());
			expect(scheduler.addJobs).toHaveBeenCalledWith(
				expect.arrayContaining([expect.objectContaining({ id: "mon-1", template: "monitor-job", repeat: 60000, active: true })])
			);
		});

		it("adds geo check job when geoCheckEnabled and type supports it", async () => {
			const { queue, scheduler } = createQueue();
			await queue.addJob("mon-1", makeMonitor({ geoCheckEnabled: true, type: "http", geoCheckInterval: 300000 }));
			expect(scheduler.addJobs).toHaveBeenCalledWith(
				expect.arrayContaining([expect.objectContaining({ id: "mon-1-geo", template: "geo-check-job", repeat: 300000 })])
			);
		});

		it("skips geo job when type does not support geo checks", async () => {
			const { queue, scheduler } = createQueue();
			await queue.addJob("mon-1", makeMonitor({ geoCheckEnabled: true, type: "hardware" }));
			expect(scheduler.addJobs).toHaveBeenCalledWith(expect.not.arrayContaining([expect.objectContaining({ id: "mon-1-geo" })]));
		});

		it("skips geo job when geoCheckEnabled is false", async () => {
			const { queue, scheduler } = createQueue();
			await queue.addJob("mon-1", makeMonitor({ geoCheckEnabled: false, type: "http" }));
			expect(scheduler.addJobs).toHaveBeenCalledWith(expect.not.arrayContaining([expect.objectContaining({ id: "mon-1-geo" })]));
		});
	});

	// ── deleteJob ──────────────────────────────────────────────────────────────

	describe("deleteJob", () => {
		it("removes monitor job", async () => {
			const { queue, scheduler } = createQueue();
			await queue.deleteJob(makeMonitor());
			expect(scheduler.removeJob).toHaveBeenCalledWith("mon-1");
		});

		it("removes geo job if it exists", async () => {
			const { queue, scheduler } = createQueue();
			(scheduler.getJob as jest.Mock).mockResolvedValue({ id: "mon-1-geo" });
			await queue.deleteJob(makeMonitor());
			expect(scheduler.removeJob).toHaveBeenCalledWith("mon-1-geo");
		});

		it("does not remove geo job if it does not exist", async () => {
			const { queue, scheduler } = createQueue();
			await queue.deleteJob(makeMonitor());
			expect(scheduler.removeJob).not.toHaveBeenCalledWith("mon-1-geo");
		});
	});

	// ── pauseJob ───────────────────────────────────────────────────────────────

	describe("pauseJob", () => {
		it("pauses monitor and geo job when geo exists", async () => {
			const { queue, scheduler, logger } = createQueue();
			(scheduler.getJob as jest.Mock).mockResolvedValue({ id: "mon-1-geo" });
			await queue.pauseJob(makeMonitor());

			expect(scheduler.pauseJob).toHaveBeenCalledWith("mon-1");
			expect(scheduler.pauseJob).toHaveBeenCalledWith("mon-1-geo");
			expect(logger.debug).toHaveBeenCalledWith(expect.objectContaining({ message: "Paused monitor mon-1" }));
		});

		it("does not pause geo job when it does not exist", async () => {
			const { queue, scheduler } = createQueue();
			await queue.pauseJob(makeMonitor());
			expect(scheduler.pauseJob).toHaveBeenCalledWith("mon-1");
			expect(scheduler.pauseJob).not.toHaveBeenCalledWith("mon-1-geo");
		});

		it("throws when scheduler.pauseJob returns false for the main job", async () => {
			const { queue, scheduler } = createQueue();
			(scheduler.pauseJob as jest.Mock).mockResolvedValue(false);
			await expect(queue.pauseJob(makeMonitor())).rejects.toThrow("Failed to pause monitor");
		});

		it("logs error but does not throw when geo pauseJob returns false", async () => {
			const { queue, scheduler, logger } = createQueue();
			(scheduler.getJob as jest.Mock).mockResolvedValue({ id: "mon-1-geo" });
			(scheduler.pauseJob as jest.Mock).mockImplementation(async (id: string) => id !== "mon-1-geo");

			await expect(queue.pauseJob(makeMonitor())).resolves.toBeUndefined();
			expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: "Failed to pause geo check job for monitor mon-1" }));
		});
	});

	// ── resumeJob ──────────────────────────────────────────────────────────────

	describe("resumeJob", () => {
		it("resumes monitor and geo job when geo exists", async () => {
			const { queue, scheduler, logger } = createQueue();
			(scheduler.getJob as jest.Mock).mockResolvedValue({ id: "mon-1-geo" });
			await queue.resumeJob(makeMonitor());

			expect(scheduler.resumeJob).toHaveBeenCalledWith("mon-1");
			expect(scheduler.resumeJob).toHaveBeenCalledWith("mon-1-geo");
			expect(logger.debug).toHaveBeenCalledWith(expect.objectContaining({ message: "Resumed monitor mon-1" }));
		});

		it("does not resume geo job when it does not exist", async () => {
			const { queue, scheduler } = createQueue();
			await queue.resumeJob(makeMonitor());
			expect(scheduler.resumeJob).toHaveBeenCalledWith("mon-1");
			expect(scheduler.resumeJob).not.toHaveBeenCalledWith("mon-1-geo");
		});

		it("throws when scheduler.resumeJob returns false for the main job", async () => {
			const { queue, scheduler } = createQueue();
			(scheduler.resumeJob as jest.Mock).mockResolvedValue(false);
			await expect(queue.resumeJob(makeMonitor())).rejects.toThrow("Failed to resume monitor");
		});

		it("logs error but does not throw when geo resumeJob returns false", async () => {
			const { queue, scheduler, logger } = createQueue();
			(scheduler.getJob as jest.Mock).mockResolvedValue({ id: "mon-1-geo" });
			(scheduler.resumeJob as jest.Mock).mockImplementation(async (id: string) => id !== "mon-1-geo");

			await expect(queue.resumeJob(makeMonitor())).resolves.toBeUndefined();
			expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: "Failed to resume geo check job for monitor mon-1" }));
		});
	});

	// ── updateJob / syncGeoJob ─────────────────────────────────────────────────

	describe("updateJob", () => {
		it("updates monitor job with new interval", async () => {
			const { queue, scheduler } = createQueue();
			const monitor = makeMonitor({ interval: 120000 });
			await queue.updateJob(monitor);
			expect(scheduler.updateJob).toHaveBeenCalledWith("mon-1", expect.objectContaining({ repeat: 120000, data: monitor }));
		});

		it("removes existing geo job when geoCheckEnabled is false", async () => {
			const { queue, scheduler } = createQueue();
			(scheduler.getJob as jest.Mock).mockResolvedValue({ id: "mon-1-geo" });
			await queue.updateJob(makeMonitor({ geoCheckEnabled: false, type: "http" }));
			expect(scheduler.removeJob).toHaveBeenCalledWith("mon-1-geo");
		});

		it("removes existing geo job when type does not support geo checks", async () => {
			const { queue, scheduler } = createQueue();
			(scheduler.getJob as jest.Mock).mockResolvedValue({ id: "mon-1-geo" });
			await queue.updateJob(makeMonitor({ geoCheckEnabled: true, type: "hardware" }));
			expect(scheduler.removeJob).toHaveBeenCalledWith("mon-1-geo");
		});

		it("updates existing geo job when geoCheckEnabled", async () => {
			const { queue, scheduler } = createQueue();
			(scheduler.getJob as jest.Mock).mockResolvedValue({ id: "mon-1-geo" });
			const monitor = makeMonitor({ geoCheckEnabled: true, type: "http", geoCheckInterval: 300000 });
			await queue.updateJob(monitor);
			expect(scheduler.updateJob).toHaveBeenCalledWith("mon-1-geo", expect.objectContaining({ repeat: 300000 }));
		});

		it("creates new geo job when enabled but no existing job", async () => {
			const { queue, scheduler } = createQueue();
			const monitor = makeMonitor({ geoCheckEnabled: true, type: "http", geoCheckInterval: 300000 });
			await queue.updateJob(monitor);
			expect(scheduler.addJob).toHaveBeenCalledWith(expect.objectContaining({ id: "mon-1-geo", template: "geo-check-job" }));
		});
	});

	// ── shutdown ───────────────────────────────────────────────────────────────

	describe("shutdown", () => {
		it("stops the scheduler", async () => {
			const { queue, scheduler } = createQueue();
			await queue.shutdown();
			expect(scheduler.stop).toHaveBeenCalled();
		});
	});

	// ── getMetrics ─────────────────────────────────────────────────────────────

	describe("getMetrics", () => {
		it("returns empty metrics when no jobs", async () => {
			const { queue } = createQueue();
			const metrics = await queue.getMetrics();
			expect(metrics).toEqual({ jobs: 0, activeJobs: 0, failingJobs: 0, jobsWithFailures: [], totalRuns: 0, totalFailures: 0, workers: [] });
		});

		it("maps the store's aggregate counters through", async () => {
			const { queue, scheduler } = createQueue();
			(scheduler.getStats as jest.Mock).mockResolvedValue({
				jobs: 2,
				activeJobs: 1,
				failingJobs: 1,
				totalRuns: 15,
				totalFailures: 2,
				jobsWithFailures: [],
			});
			const metrics = await queue.getMetrics();
			expect(metrics).toMatchObject({ jobs: 2, activeJobs: 1, failingJobs: 1, totalRuns: 15, totalFailures: 2 });
		});

		it("derives monitor fields for failing monitor jobs from job data", async () => {
			const { queue, scheduler } = createQueue();
			(scheduler.getStats as jest.Mock).mockResolvedValue({
				jobs: 1,
				activeJobs: 0,
				failingJobs: 1,
				totalRuns: 10,
				totalFailures: 2,
				jobsWithFailures: [{ id: "m1", data: { url: "http://a.com", type: "http" }, failedAt: 200, failCount: 2, failReason: "timeout" }],
			});
			const metrics = await queue.getMetrics();
			expect(metrics.jobsWithFailures).toEqual([
				{ monitorId: "m1", monitorUrl: "http://a.com", monitorType: "http", failedAt: 200, failCount: 2, failReason: "timeout" },
			]);
		});

		it("leaves monitor fields null for non-monitor (cleanup) failures", async () => {
			const { queue, scheduler } = createQueue();
			(scheduler.getStats as jest.Mock).mockResolvedValue({
				jobs: 1,
				activeJobs: 0,
				failingJobs: 1,
				totalRuns: 1,
				totalFailures: 1,
				jobsWithFailures: [{ id: "cleanup-orphaned", data: undefined, failedAt: 100, failCount: 1, failReason: "boom" }],
			});
			const metrics = await queue.getMetrics();
			expect(metrics.jobsWithFailures[0]).toEqual({
				monitorId: "cleanup-orphaned",
				monitorUrl: null,
				monitorType: null,
				failedAt: 100,
				failCount: 1,
				failReason: "boom",
			});
		});
	});

	// ── getMetrics: worker registry ──────────────────────────────────────────────

	describe("getMetrics - worker registry", () => {
		it("returns the alive workers from the registry", async () => {
			const { queue, workersRepository } = createQueue();
			const alive = [
				{ workerId: "host:1:aaa", mode: "primary", lastSeenAt: 1000 },
				{ workerId: "host:2:bbb", mode: "worker", lastSeenAt: 2000 },
			];
			(workersRepository.findRecent as jest.Mock).mockResolvedValue(alive);

			const metrics = await queue.getMetrics();

			expect(workersRepository.findRecent).toHaveBeenCalledWith(30000);
			expect(metrics.workers).toEqual(alive);
		});
	});

	// ── getJobs ────────────────────────────────────────────────────────────────

	describe("getJobs", () => {
		it("maps scheduler jobs to summaries", async () => {
			const { queue, scheduler } = createQueue();
			(scheduler.getJobs as jest.Mock).mockResolvedValue([
				{
					id: "m1",
					template: "monitor-job",
					active: true,
					repeat: 60000,
					lockedAt: null,
					runCount: 5,
					failCount: 1,
					lastError: "timeout",
					lastStartedAt: 1000,
					lastFinishedAt: 1100,
					lastFailedAt: 900,
					data: { url: "http://a.com", type: "http", interval: 60000, geoCheckInterval: 300000, isActive: true },
				},
			]);
			const { jobs } = await queue.getJobs({});

			expect(jobs).toHaveLength(1);
			expect(jobs[0]).toEqual({
				monitorId: "m1",
				monitorUrl: "http://a.com",
				monitorType: "http",
				monitorInterval: 60000,
				monitorGeoInterval: 300000,
				monitorActive: true,
				active: true,
				repeat: 60000,
				lockedBy: null,
				lockedUntil: null,
				lockedAt: null,
				runCount: 5,
				failCount: 1,
				failReason: "timeout",
				lastRunAt: 1000,
				lastFinishedAt: 1100,
				lastRunTook: 100,
				lastFailedAt: 900,
			});
		});

		it("returns null lastRunTook when job is locked", async () => {
			const { queue, scheduler } = createQueue();
			(scheduler.getJobs as jest.Mock).mockResolvedValue([
				{
					id: "m1",
					template: "monitor-job",
					active: true,
					lockedAt: 999,
					runCount: 1,
					lastStartedAt: 1000,
					lastFinishedAt: 1100,
					data: { url: "a", type: "http", interval: 60000 },
				},
			]);
			const { jobs } = await queue.getJobs({});
			expect(jobs[0].lastRunTook).toBeNull();
		});

		it("leaves monitor fields null for non-monitor jobs", async () => {
			const { queue, scheduler } = createQueue();
			(scheduler.getJobs as jest.Mock).mockResolvedValue([{ id: "cleanup-orphaned", template: "cleanup-orphaned", active: true, data: undefined }]);
			const { jobs } = await queue.getJobs({});
			expect(jobs[0].monitorUrl).toBeNull();
			expect(jobs[0].monitorType).toBeNull();
			expect(jobs[0].monitorInterval).toBeNull();
			expect(jobs[0].monitorGeoInterval).toBeNull();
			expect(jobs[0].monitorActive).toBeNull();
		});

		it("pushes pagination to the scheduler and returns its total count", async () => {
			const { queue, scheduler } = createQueue();
			(scheduler.getJobs as jest.Mock).mockResolvedValue([
				{ id: "m1", template: "monitor-job", active: true, data: { url: "a", type: "http", interval: 60000 } },
			]);
			(scheduler.countJobs as jest.Mock).mockResolvedValue(42);

			const { jobs, count } = await queue.getJobs({ page: 2, rowsPerPage: 10 });

			expect(scheduler.getJobs).toHaveBeenCalledWith({ skip: 20, limit: 10 });
			expect(count).toBe(42);
			expect(jobs).toHaveLength(1);
		});

		it("requests all jobs when rowsPerPage is omitted", async () => {
			const { queue, scheduler } = createQueue();
			(scheduler.countJobs as jest.Mock).mockResolvedValue(7);

			const { count } = await queue.getJobs({});

			expect(scheduler.getJobs).toHaveBeenCalledWith(undefined);
			expect(count).toBe(7);
		});
	});

	// ── flushQueues ────────────────────────────────────────────────────────────

	describe("flushQueues", () => {
		it("stops, flushes, and reinitializes", async () => {
			const { queue, scheduler } = createQueue();
			const result = await queue.flushQueues();
			expect(scheduler.stop).toHaveBeenCalled();
			expect(scheduler.flushJobs).toHaveBeenCalled();
			expect(result.success).toBe(true);
		});

		it("flushes before stopping, so the store is still connected for removeAll", async () => {
			const { queue, scheduler } = createQueue();
			const order: string[] = [];
			(scheduler.flushJobs as jest.Mock).mockImplementation(async () => {
				order.push("flush");
				return true;
			});
			(scheduler.stop as jest.Mock).mockImplementation(async () => {
				order.push("stop");
				return true;
			});
			await queue.flushQueues();
			expect(order).toEqual(["flush", "stop"]);
		});

		it("refuses to flush on a non-primary worker without touching the scheduler", async () => {
			const { queue, scheduler } = createQueue({ queueMode: "worker" });
			const result = await queue.flushQueues();
			expect(result.success).toBe(false);
			expect(scheduler.flushJobs).not.toHaveBeenCalled();
			expect(scheduler.stop).not.toHaveBeenCalled();
		});

		it("returns false when flush fails", async () => {
			const { queue, scheduler } = createQueue();
			(scheduler.flushJobs as jest.Mock).mockResolvedValue(false);
			const result = await queue.flushQueues();
			expect(result.success).toBe(false);
		});
	});

	// ── static create ──────────────────────────────────────────────────────────

	describe("static create", () => {
		const envSettings = { dbConnectionString: "mongodb://localhost:27017/test_db" } as any;

		it("creates a MongoStore + Scheduler and inits in primary mode", async () => {
			const logger = createMockLogger();
			const helper = createQueueHelper();
			const monitorsRepository = createMonitorsRepo();
			const workersRepository = createWorkersRepo();

			const instance = await LessSimpleQueue.create(
				logger as any,
				helper as any,
				monitorsRepository as any,
				workersRepository as any,
				envSettings,
				"primary"
			);

			expect(MockMongoStore).toHaveBeenCalledWith(expect.objectContaining({ url: "mongodb://localhost:27017/test_db" }));
			expect(MockScheduler).toHaveBeenCalled();
			expect(instance).toBeInstanceOf(LessSimpleQueue);
			expect(mockSchedulerInstance.start).toHaveBeenCalled();
			expect(monitorsRepository.findAll).toHaveBeenCalled();
		});

		it("inits in worker mode without seeding monitors", async () => {
			const logger = createMockLogger();
			const helper = createQueueHelper();
			const monitorsRepository = createMonitorsRepo();
			const workersRepository = createWorkersRepo();

			const instance = await LessSimpleQueue.create(
				logger as any,
				helper as any,
				monitorsRepository as any,
				workersRepository as any,
				envSettings,
				"worker"
			);

			expect(instance).toBeInstanceOf(LessSimpleQueue);
			expect(monitorsRepository.findAll).not.toHaveBeenCalled();
		});
	});

	// ── worker heartbeat / deregistration ────────────────────────────────────────

	describe("worker heartbeat", () => {
		it("writes a heartbeat on init with the workerId and mode (primary)", async () => {
			const { queue, workersRepository } = createQueue();
			await queue.init("primary");
			expect(workersRepository.upsert).toHaveBeenCalledWith("host-1:1234:abcd", "primary");
		});

		it("writes a heartbeat on init with the workerId and mode (worker)", async () => {
			const { queue, workersRepository } = createQueue();
			await queue.init("worker");
			expect(workersRepository.upsert).toHaveBeenCalledWith("host-1:1234:abcd", "worker");
		});

		it("beats again on each scheduler:heartbeat event", async () => {
			const { queue, scheduler, workersRepository } = createQueue();
			await queue.init("worker");
			(workersRepository.upsert as jest.Mock).mockClear();

			scheduler.emit("scheduler:heartbeat", "host-1:1234:abcd");
			scheduler.emit("scheduler:heartbeat", "host-1:1234:abcd");

			expect(workersRepository.upsert).toHaveBeenCalledTimes(2);
			expect(workersRepository.upsert).toHaveBeenCalledWith("host-1:1234:abcd", "worker");
		});

		it("stops beating after shutdown", async () => {
			const { queue, scheduler, workersRepository } = createQueue();
			await queue.init("worker");
			await queue.shutdown();
			(workersRepository.upsert as jest.Mock).mockClear();

			scheduler.emit("scheduler:heartbeat", "host-1:1234:abcd");

			expect(workersRepository.upsert).not.toHaveBeenCalled();
		});

		it("deregisters the worker and stops the scheduler on shutdown", async () => {
			const { queue, scheduler, workersRepository } = createQueue();
			await queue.init("worker");
			await queue.shutdown();
			expect(workersRepository.deleteById).toHaveBeenCalledWith("host-1:1234:abcd");
			expect(scheduler.stop).toHaveBeenCalled();
		});
	});
});
