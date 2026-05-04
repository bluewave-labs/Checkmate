import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import type { Monitor } from "../../../src/types/monitor.ts";

// ── Mock Scheduler ───────────────────────────────────────────────────────────

const createScheduler = () => {
	const listeners: Record<string, Function[]> = {};
	return {
		on: jest.fn((event: string, cb: Function) => {
			listeners[event] = listeners[event] || [];
			listeners[event].push(cb);
		}),
		emit: (event: string, ...args: unknown[]) => {
			(listeners[event] || []).forEach((cb) => cb(...args));
		},
		start: jest.fn(),
		stop: jest.fn().mockResolvedValue(true),
		addTemplate: jest.fn(),
		addJob: jest.fn(),
		removeJob: jest.fn(),
		getJob: jest.fn().mockResolvedValue(null),
		getJobs: jest.fn().mockResolvedValue([]),
		pauseJob: jest.fn().mockResolvedValue(true),
		resumeJob: jest.fn().mockResolvedValue(true),
		updateJob: jest.fn(),
		flushJobs: jest.fn().mockResolvedValue(true),
	};
};

const mockSchedulerInstance = createScheduler();
const MockScheduler = jest.fn().mockReturnValue(mockSchedulerInstance);

jest.unstable_mockModule("super-simple-scheduler", () => ({
	default: MockScheduler,
}));

const { SuperSimpleQueue } = await import("../../../src/service/infrastructure/SuperSimpleQueue/SuperSimpleQueue.ts");

const createQueueHelper = () => ({
	getHeartbeatJob: jest.fn().mockReturnValue(() => Promise.resolve()),
	getHeartbeatGeoJob: jest.fn().mockReturnValue(() => Promise.resolve()),
	getCleanupOrphanedJob: jest.fn().mockReturnValue(() => Promise.resolve()),
	getCleanupRetentionJob: jest.fn().mockReturnValue(() => Promise.resolve()),
});

const createMonitorsRepo = () => ({
	findAll: jest.fn().mockResolvedValue([]),
});

const createQueue = (overrides?: Record<string, unknown>) => {
	const logger = createMockLogger();
	const helper = createQueueHelper();
	const monitorsRepository = createMonitorsRepo();
	const scheduler = createScheduler();

	const defaults = { logger, helper, monitorsRepository, scheduler, ...overrides };

	const queue = new SuperSimpleQueue(defaults.logger as any, defaults.helper as any, defaults.monitorsRepository as any, defaults.scheduler as any);
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

describe("SuperSimpleQueue", () => {
	describe("serviceName", () => {
		it("returns JobQueue", () => {
			const { queue } = createQueue();
			expect(queue.serviceName).toBe("JobQueue");
		});
	});

	// ── init ─────────────────────────────────────────────────────────────────

	describe("init", () => {
		it("registers listeners, starts scheduler, adds templates and system jobs", async () => {
			const { queue, scheduler, helper } = createQueue();

			const result = await queue.init();

			expect(result).toBe(true);
			expect(scheduler.start).toHaveBeenCalled();
			expect(scheduler.addTemplate).toHaveBeenCalledWith("monitor-job", expect.any(Function));
			expect(scheduler.addTemplate).toHaveBeenCalledWith("geo-check-job", expect.any(Function));
			expect(scheduler.addTemplate).toHaveBeenCalledWith("cleanup-orphaned", expect.any(Function));
			expect(scheduler.addTemplate).toHaveBeenCalledWith("cleanup-retention-job", expect.any(Function));
			expect(scheduler.addJob).toHaveBeenCalledWith(expect.objectContaining({ id: "cleanup-orphaned" }));
			expect(scheduler.addJob).toHaveBeenCalledWith(expect.objectContaining({ id: "cleanup-retention" }));
		});

		it("schedules existing monitors with staggered offsets", async () => {
			jest.useFakeTimers();
			const monitors = [makeMonitor({ id: "m1" }), makeMonitor({ id: "m2" })];
			const { queue, scheduler, monitorsRepository } = createQueue();
			(monitorsRepository.findAll as jest.Mock).mockResolvedValue(monitors);

			await queue.init();
			jest.runAllTimers();

			// Each monitor gets addJob called (once for the monitor itself via addJob method)
			// The init schedules via setTimeout → addJob, plus the two system jobs
			expect(scheduler.addJob).toHaveBeenCalledWith(expect.objectContaining({ id: "m1", template: "monitor-job" }));
			expect(scheduler.addJob).toHaveBeenCalledWith(expect.objectContaining({ id: "m2", template: "monitor-job" }));
			jest.useRealTimers();
		});

		it("returns true when findAll returns null", async () => {
			const { queue, monitorsRepository, scheduler } = createQueue();
			(monitorsRepository.findAll as jest.Mock).mockResolvedValue(null);

			const result = await queue.init();

			expect(result).toBe(true);
			// System jobs should not be added when monitors is null (early return)
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

	// ── registerListeners ────────────────────────────────────────────────────

	describe("registerListeners (via init)", () => {
		it("logs on scheduler:start", async () => {
			const { queue, scheduler, logger } = createQueue();
			await queue.init();
			scheduler.emit("scheduler:start");
			expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: "Scheduler started" }));
		});

		it("logs on scheduler:stop", async () => {
			const { queue, scheduler, logger } = createQueue();
			await queue.init();
			scheduler.emit("scheduler:stop");
			expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: "Scheduler stopped" }));
		});

		it("logs on scheduler:error with Error", async () => {
			const { queue, scheduler, logger } = createQueue();
			await queue.init();
			scheduler.emit("scheduler:error", new Error("boom"));
			expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: "Scheduler error: boom" }));
		});

		it("logs on scheduler:error with non-Error", async () => {
			const { queue, scheduler, logger } = createQueue();
			await queue.init();
			scheduler.emit("scheduler:error", "string error");
			expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: "Scheduler error: string error", stack: undefined }));
		});

		it("logs on job:abort", async () => {
			const { queue, scheduler, logger } = createQueue();
			await queue.init();
			scheduler.emit("job:abort", { id: "m1" }, "timeout");
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: "m1 aborted: timeout" }));
		});

		it("logs on job:attempt", async () => {
			const { queue, scheduler, logger } = createQueue();
			await queue.init();
			scheduler.emit("job:attempt", { id: "m1" }, 2);
			expect(logger.debug).toHaveBeenCalledWith(expect.objectContaining({ message: "m1 attempt 2" }));
		});

		it("logs on job:complete", async () => {
			const { queue, scheduler, logger } = createQueue();
			await queue.init();
			scheduler.emit("job:complete", { id: "m1" });
			expect(logger.debug).toHaveBeenCalledWith(expect.objectContaining({ message: "m1 completed successfully" }));
		});

		it("logs on job:exhausted with Error", async () => {
			const { queue, scheduler, logger } = createQueue();
			await queue.init();
			scheduler.emit("job:exhausted", { id: "m1" }, new Error("gave up"));
			expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: "m1 exhausted all retries: gave up" }));
		});

		it("logs on job:exhausted with non-Error", async () => {
			const { queue, scheduler, logger } = createQueue();
			await queue.init();
			scheduler.emit("job:exhausted", { id: "m1" }, "gave up");
			expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: "m1 exhausted all retries: gave up", stack: undefined }));
		});

		it("logs on job:fail with Error", async () => {
			const { queue, scheduler, logger } = createQueue();
			await queue.init();
			scheduler.emit("job:fail", { id: "m1" }, new Error("oops"), 1);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: "m1 failed on attempt 1: oops" }));
		});

		it("logs on job:fail with non-Error", async () => {
			const { queue, scheduler, logger } = createQueue();
			await queue.init();
			scheduler.emit("job:fail", { id: "m1" }, "oops", 1);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: "m1 failed on attempt 1: oops", stack: undefined }));
		});

		it("logs on job:start", async () => {
			const { queue, scheduler, logger } = createQueue();
			await queue.init();
			scheduler.emit("job:start", { id: "m1" });
			expect(logger.debug).toHaveBeenCalledWith(expect.objectContaining({ message: "m1 started" }));
		});
	});

	// ── addJob ───────────────────────────────────────────────────────────────

	describe("addJob", () => {
		it("adds monitor job to scheduler", async () => {
			const { queue, scheduler } = createQueue();
			await queue.addJob("mon-1", makeMonitor());
			expect(scheduler.addJob).toHaveBeenCalledWith(expect.objectContaining({ id: "mon-1", template: "monitor-job", repeat: 60000, active: true }));
		});

		it("adds geo check job when geoCheckEnabled and type supports it", async () => {
			const { queue, scheduler } = createQueue();
			await queue.addJob("mon-1", makeMonitor({ geoCheckEnabled: true, type: "http", geoCheckInterval: 300000 }));
			expect(scheduler.addJob).toHaveBeenCalledWith(expect.objectContaining({ id: "mon-1-geo", template: "geo-check-job", repeat: 300000 }));
		});

		it("skips geo job when type does not support geo checks", async () => {
			const { queue, scheduler } = createQueue();
			await queue.addJob("mon-1", makeMonitor({ geoCheckEnabled: true, type: "hardware" }));
			expect(scheduler.addJob).not.toHaveBeenCalledWith(expect.objectContaining({ id: "mon-1-geo" }));
		});

		it("skips geo job when geoCheckEnabled is false", async () => {
			const { queue, scheduler } = createQueue();
			await queue.addJob("mon-1", makeMonitor({ geoCheckEnabled: false, type: "http" }));
			expect(scheduler.addJob).not.toHaveBeenCalledWith(expect.objectContaining({ id: "mon-1-geo" }));
		});
	});

	// ── deleteJob ────────────────────────────────────────────────────────────

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

	// ── pauseJob ─────────────────────────────────────────────────────────────

	describe("pauseJob", () => {
		it("pauses monitor and pauses geo job when geo exists", async () => {
			const { queue, scheduler, logger } = createQueue();
			(scheduler.getJob as jest.Mock).mockResolvedValue({ id: "mon-1-geo" });
			await queue.pauseJob(makeMonitor());

			expect(scheduler.pauseJob).toHaveBeenCalledWith("mon-1");
			expect(scheduler.pauseJob).toHaveBeenCalledWith("mon-1-geo");
			expect(scheduler.removeJob).not.toHaveBeenCalledWith("mon-1-geo");
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

	// ── resumeJob ────────────────────────────────────────────────────────────

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

		it("preserves geo job through a pause/resume cycle", async () => {
			const { queue, scheduler } = createQueue();
			(scheduler.getJob as jest.Mock).mockResolvedValue({ id: "mon-1-geo" });

			await queue.pauseJob(makeMonitor());
			await queue.resumeJob(makeMonitor());

			expect(scheduler.removeJob).not.toHaveBeenCalledWith("mon-1-geo");
			expect(scheduler.pauseJob).toHaveBeenCalledWith("mon-1-geo");
			expect(scheduler.resumeJob).toHaveBeenCalledWith("mon-1-geo");
		});
	});

	// ── updateJob ────────────────────────────────────────────────────────────

	describe("updateJob", () => {
		it("updates monitor job and syncs geo job", async () => {
			const { queue, scheduler } = createQueue();
			const monitor = makeMonitor({ interval: 120000 });
			await queue.updateJob(monitor);
			expect(scheduler.updateJob).toHaveBeenCalledWith("mon-1", expect.objectContaining({ repeat: 120000, data: monitor }));
		});
	});

	// ── syncGeoJob (via updateJob) ───────────────────────────────────────────

	describe("syncGeoJob (via updateJob)", () => {
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

		it("does not remove when geo disabled and no existing geo job", async () => {
			const { queue, scheduler } = createQueue();
			await queue.updateJob(makeMonitor({ geoCheckEnabled: false }));
			expect(scheduler.removeJob).not.toHaveBeenCalledWith("mon-1-geo");
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

	// ── shutdown ──────────────────────────────────────────────────────────────

	describe("shutdown", () => {
		it("stops the scheduler", async () => {
			const { queue, scheduler } = createQueue();
			await queue.shutdown();
			expect(scheduler.stop).toHaveBeenCalled();
		});
	});

	// ── getMetrics ───────────────────────────────────────────────────────────

	describe("getMetrics", () => {
		it("returns empty metrics when no jobs", async () => {
			const { queue } = createQueue();
			const metrics = await queue.getMetrics();
			expect(metrics).toEqual({ jobs: 0, activeJobs: 0, failingJobs: 0, jobsWithFailures: [], totalRuns: 0, totalFailures: 0 });
		});

		it("aggregates metrics from jobs", async () => {
			const { queue, scheduler } = createQueue();
			(scheduler.getJobs as jest.Mock).mockResolvedValue([
				{ id: "m1", runCount: 10, failCount: 2, lastFailedAt: 200, lastRunAt: 100, lockedAt: null, data: { url: "http://a.com", type: "http" } },
				{ id: "m2", runCount: 5, failCount: 0, lastFailedAt: 0, lastRunAt: 50, lockedAt: 999, data: { url: "http://b.com", type: "ping" } },
			]);
			const metrics = await queue.getMetrics();

			expect(metrics.jobs).toBe(2);
			expect(metrics.totalRuns).toBe(15);
			expect(metrics.totalFailures).toBe(2);
			expect(metrics.activeJobs).toBe(1);
			expect(metrics.failingJobs).toBe(1);
			expect(metrics.jobsWithFailures).toHaveLength(1);
			expect(metrics.jobsWithFailures[0]).toEqual(expect.objectContaining({ monitorId: "m1", failCount: 2, monitorUrl: "http://a.com" }));
		});

		it("handles jobs with undefined fields", async () => {
			const { queue, scheduler } = createQueue();
			(scheduler.getJobs as jest.Mock).mockResolvedValue([{ id: "m1", data: null }]);
			const metrics = await queue.getMetrics();
			expect(metrics.jobs).toBe(1);
			expect(metrics.totalRuns).toBe(0);
		});

		it("handles failing job with null data", async () => {
			const { queue, scheduler } = createQueue();
			(scheduler.getJobs as jest.Mock).mockResolvedValue([
				{ id: "m1", runCount: 1, failCount: 1, lastFailedAt: 100, lastRunAt: 50, data: null, lastFailReason: "timeout" },
			]);
			const metrics = await queue.getMetrics();
			expect(metrics.jobsWithFailures).toHaveLength(1);
			expect(metrics.jobsWithFailures[0].monitorUrl).toBeNull();
			expect(metrics.jobsWithFailures[0].monitorType).toBeNull();
			expect(metrics.jobsWithFailures[0].failReason).toBe("timeout");
		});

		it("handles failing job with undefined lastFailedAt and lastFailReason", async () => {
			const { queue, scheduler } = createQueue();
			(scheduler.getJobs as jest.Mock).mockResolvedValue([{ id: "m1", runCount: 1, failCount: 1, data: { url: "http://a.com", type: "http" } }]);
			const metrics = await queue.getMetrics();
			expect(metrics.jobsWithFailures[0].failedAt).toBeNull();
			expect(metrics.jobsWithFailures[0].failReason).toBeNull();
		});

		it("does not count as failing when lastFailedAt < lastRunAt", async () => {
			const { queue, scheduler } = createQueue();
			(scheduler.getJobs as jest.Mock).mockResolvedValue([
				{ id: "m1", runCount: 10, failCount: 1, lastFailedAt: 50, lastRunAt: 100, data: { url: "a" } },
			]);
			const metrics = await queue.getMetrics();
			expect(metrics.failingJobs).toBe(0);
			expect(metrics.jobsWithFailures).toHaveLength(1);
		});
	});

	// ── getJobs ──────────────────────────────────────────────────────────────

	describe("getJobs", () => {
		it("maps scheduler jobs to summaries", async () => {
			const { queue, scheduler } = createQueue();
			(scheduler.getJobs as jest.Mock).mockResolvedValue([
				{
					id: "m1",
					active: true,
					lockedAt: null,
					runCount: 5,
					failCount: 1,
					lastFailReason: "timeout",
					lastRunAt: 1000,
					lastFinishedAt: 1100,
					lastFailedAt: 900,
					data: { url: "http://a.com", type: "http", interval: 60000 },
				},
			]);
			const jobs = await queue.getJobs();

			expect(jobs).toHaveLength(1);
			expect(jobs[0]).toEqual({
				monitorId: "m1",
				monitorUrl: "http://a.com",
				monitorType: "http",
				monitorInterval: 60000,
				active: true,
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
				{ id: "m1", active: true, lockedAt: 999, runCount: 1, data: { url: "a", type: "http", interval: 60000 } },
			]);
			const jobs = await queue.getJobs();
			expect(jobs[0].lastRunTook).toBeNull();
		});

		it("handles jobs with missing data", async () => {
			const { queue, scheduler } = createQueue();
			(scheduler.getJobs as jest.Mock).mockResolvedValue([{ id: "m1", active: true, data: null }]);
			const jobs = await queue.getJobs();
			expect(jobs[0].monitorUrl).toBeNull();
			expect(jobs[0].monitorType).toBeNull();
			expect(jobs[0].monitorInterval).toBeNull();
		});
	});

	// ── flushQueues ──────────────────────────────────────────────────────────

	describe("flushQueues", () => {
		it("stops, flushes, and reinitializes", async () => {
			const { queue, scheduler } = createQueue();
			const result = await queue.flushQueues();
			expect(scheduler.stop).toHaveBeenCalled();
			expect(scheduler.flushJobs).toHaveBeenCalled();
			expect(result.success).toBe(true);
		});

		it("returns false when any step fails", async () => {
			const { queue, scheduler } = createQueue();
			(scheduler.flushJobs as jest.Mock).mockResolvedValue(false);
			const result = await queue.flushQueues();
			expect(result.success).toBe(false);
		});
	});

	// ── static create ────────────────────────────────────────────────────────

	describe("static create", () => {
		it("creates a SuperSimpleQueue instance with a Scheduler and calls init", async () => {
			const logger = createMockLogger();
			const helper = createQueueHelper();
			const monitorsRepository = createMonitorsRepo();

			const instance = await SuperSimpleQueue.create(logger as any, helper as any, monitorsRepository as any);

			expect(MockScheduler).toHaveBeenCalled();
			expect(instance).toBeInstanceOf(SuperSimpleQueue);
			// init was called, which calls scheduler.start
			expect(mockSchedulerInstance.start).toHaveBeenCalled();
		});
	});
});
