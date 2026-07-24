import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";
import { JobScheduler } from "../../../src/worker/worker.job-scheduler.ts";
import type { Monitor } from "../../../src/domain/monitors/monitor.type.ts";
import type { QueueMode } from "../../../src/domain/app-settings/app-settings.type.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

// ── Notes ──────────────────────────────────────────────────────────────────────
//
// JobScheduler is the scheduler-only primary base class: it owns the queue
// registry/heartbeat AND, on a primary, the reconcile that seeds the jobs
// collection — scheduling is its job whether or not it also processes. It runs no
// polling loops and has no buffer, so drain() is a no-op beyond setting the stop
// flag — it must NOT tear down (clear timers or deregister the worker); that stays
// in shutdown(). The processing tier (poll loops, buffer flush) lives in
// DBQueueWorker and is covered separately.

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

const createScheduler = (overrides?: { queueMode?: QueueMode; mocks?: Record<string, any> }) => {
	const jobsRepository = {
		upsertJob: jest.fn<any>().mockResolvedValue(true),
		upsertCleanupJob: jest.fn<any>().mockResolvedValue(true),
	};
	const queueWorkersRepository = {
		upsert: jest.fn<any>().mockResolvedValue(undefined),
		deleteById: jest.fn<any>().mockResolvedValue(undefined),
	};
	const monitorsRepository = {
		findAll: jest.fn<any>().mockResolvedValue([]),
	};
	const logger = createMockLogger();
	const mocks = { jobsRepository, queueWorkersRepository, monitorsRepository, logger, ...overrides?.mocks };
	const scheduler = new JobScheduler(
		mocks.jobsRepository as any,
		mocks.queueWorkersRepository as any,
		mocks.monitorsRepository as any,
		overrides?.queueMode ?? "primary",
		mocks.logger as any,
		"worker-1"
	);
	return { scheduler, mocks };
};

describe("JobScheduler", () => {
	describe("init", () => {
		beforeEach(() => {
			jest.useFakeTimers();
		});

		afterEach(async () => {
			jest.clearAllTimers();
			jest.useRealTimers();
		});

		it("registers the worker in the heartbeat registry on startup", async () => {
			const { scheduler, mocks } = createScheduler({ queueMode: "primary" });
			await scheduler.init();
			expect(mocks.queueWorkersRepository.upsert).toHaveBeenCalledWith("worker-1", "primary", false);
		});

		it("primary mode reconciles: seeds a check row per monitor plus the two cleanup rows", async () => {
			const { scheduler, mocks } = createScheduler({
				queueMode: "primary",
				mocks: { monitorsRepository: { findAll: jest.fn<any>().mockResolvedValue([makeMonitor()]) } },
			});
			await scheduler.init();

			const seededTypes = mocks.jobsRepository.upsertJob.mock.calls.map((c: any[]) => c[0].type);
			expect(seededTypes).toContain("check");
			const cleanupTypes = mocks.jobsRepository.upsertCleanupJob.mock.calls.map((c: any[]) => c[0].type);
			expect(cleanupTypes).toContain("cleanup-orphaned");
			expect(cleanupTypes).toContain("cleanup-retention");
		});

		it("primary mode also seeds a geo-check row for geo-enabled monitors", async () => {
			const { scheduler, mocks } = createScheduler({
				queueMode: "primary",
				mocks: { monitorsRepository: { findAll: jest.fn<any>().mockResolvedValue([makeMonitor({ geoCheckEnabled: true })]) } },
			});
			await scheduler.init();

			const seededTypes = mocks.jobsRepository.upsertJob.mock.calls.map((c: any[]) => c[0].type);
			expect(seededTypes).toContain("geo-check");
		});

		it("worker mode heartbeats but does not reconcile (no monitor reads, no seeds)", async () => {
			const { scheduler, mocks } = createScheduler({
				queueMode: "worker",
				mocks: { monitorsRepository: { findAll: jest.fn<any>().mockResolvedValue([makeMonitor()]) } },
			});
			await scheduler.init();

			expect(mocks.queueWorkersRepository.upsert).toHaveBeenCalledWith("worker-1", "worker", false);
			expect(mocks.monitorsRepository.findAll).not.toHaveBeenCalled();
			expect(mocks.jobsRepository.upsertJob).not.toHaveBeenCalled();
			expect(mocks.jobsRepository.upsertCleanupJob).not.toHaveBeenCalled();
		});

		it("arms a heartbeat interval timer that shutdown() clears and deregisters", async () => {
			const { scheduler, mocks } = createScheduler({ queueMode: "primary" });
			await scheduler.init();
			expect((scheduler as any).timers.has("heartbeat")).toBe(true);

			await scheduler.shutdown();
			expect((scheduler as any).timers.has("heartbeat")).toBe(false);
			expect(mocks.queueWorkersRepository.deleteById).toHaveBeenCalledWith("worker-1");
		});
	});

	describe("drain", () => {
		it("sets the stop and draining flags without tearing down (no deregister)", async () => {
			const { scheduler, mocks } = createScheduler();

			await scheduler.drain();

			expect((scheduler as any).stopped).toBe(true);
			expect((scheduler as any).draining).toBe(true);
			// drain must not do shutdown's teardown work
			expect(mocks.queueWorkersRepository.deleteById).not.toHaveBeenCalled();
		});

		it("stops wake() from arming a tick once drained", async () => {
			const { scheduler } = createScheduler();
			const tick = jest.fn<any>();
			(scheduler as any).tickFns.set("check", tick);

			await scheduler.drain();
			scheduler.wake("check");

			expect((scheduler as any).timers.has("check")).toBe(false);
		});
	});

	// Regression: a heartbeat upsert racing shutdown's deleteById could resurrect the
	// registry row, leaving a ghost worker that inflates the alive count until TTL.
	// shutdown() must await the in-flight beat and issue the delete as the LAST write.
	describe("shutdown (registry deregistration)", () => {
		it("awaits an in-flight heartbeat before deregistering, so the delete is the last write", async () => {
			const order: string[] = [];
			let resolveUpsert: () => void = () => {};
			const upsert = jest.fn<any>().mockImplementation(
				() =>
					new Promise<void>((res) => {
						resolveUpsert = () => {
							order.push("upsert");
							res();
						};
					})
			);
			const deleteById = jest.fn<any>().mockImplementation(async () => {
				order.push("deleteById");
			});
			const { scheduler } = createScheduler({ mocks: { queueWorkersRepository: { upsert, deleteById } } });

			// A beat fires and its upsert is still in flight (deferred, not yet committed).
			const beat = (scheduler as any).heartbeat();
			// Shutdown begins while that beat is in flight.
			const shutdownPromise = scheduler.shutdown();

			// The delete must not run until the in-flight upsert has settled.
			expect(deleteById).not.toHaveBeenCalled();

			resolveUpsert();
			await beat;
			await shutdownPromise;

			expect(deleteById).toHaveBeenCalledWith("worker-1");
			expect(order).toEqual(["upsert", "deleteById"]); // delete is always the last write to the row
		});

		it("heartbeat is a no-op once stopped, so no beat re-registers during drain/shutdown", async () => {
			const { scheduler, mocks } = createScheduler();
			await scheduler.drain(); // sets stopped = true
			mocks.queueWorkersRepository.upsert.mockClear();

			await (scheduler as any).heartbeat();

			expect(mocks.queueWorkersRepository.upsert).not.toHaveBeenCalled();
		});
	});
});
