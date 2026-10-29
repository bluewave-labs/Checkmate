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

const createScheduler = (overrides?: { queueMode?: QueueMode; telemetryEnabled?: boolean; mocks?: Record<string, any> }) => {
	const jobsRepository = {
		upsertJob: jest.fn<any>().mockResolvedValue(true),
		upsertCleanupJob: jest.fn<any>().mockResolvedValue(true),
		rescheduleOverdueChecks: jest.fn<any>().mockResolvedValue(0),
		deleteGlobalJob: jest.fn<any>().mockResolvedValue(true),
		setActiveById: jest.fn<any>().mockResolvedValue(true),
		updateScheduleById: jest.fn<any>().mockResolvedValue(true),
		updateHeartbeatScheduleById: jest.fn<any>().mockResolvedValue(true),
		deleteByIdAndType: jest.fn<any>().mockResolvedValue(true),
	};
	const queueWorkersRepository = {
		upsert: jest.fn<any>().mockResolvedValue(undefined),
		deleteById: jest.fn<any>().mockResolvedValue(undefined),
	};
	const monitorsRepository = {
		findAllForScheduling: jest.fn<any>().mockResolvedValue([]),
	};
	const logger = createMockLogger();
	const mocks = { jobsRepository, queueWorkersRepository, monitorsRepository, logger, ...overrides?.mocks };
	const scheduler = new JobScheduler(
		mocks.jobsRepository as any,
		mocks.queueWorkersRepository as any,
		mocks.monitorsRepository as any,
		overrides?.queueMode ?? "primary",
		mocks.logger as any,
		"worker-1",
		overrides?.telemetryEnabled ?? false
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
				mocks: { monitorsRepository: { findAllForScheduling: jest.fn<any>().mockResolvedValue([makeMonitor()]) } },
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
				mocks: { monitorsRepository: { findAllForScheduling: jest.fn<any>().mockResolvedValue([makeMonitor({ geoCheckEnabled: true })]) } },
			});
			await scheduler.init();

			const seededTypes = mocks.jobsRepository.upsertJob.mock.calls.map((c: any[]) => c[0].type);
			expect(seededTypes).toContain("geo-check");
		});

		it("worker mode heartbeats but does not reconcile (no monitor reads, no seeds)", async () => {
			const { scheduler, mocks } = createScheduler({
				queueMode: "worker",
				mocks: { monitorsRepository: { findAllForScheduling: jest.fn<any>().mockResolvedValue([makeMonitor()]) } },
			});
			await scheduler.init();

			expect(mocks.queueWorkersRepository.upsert).toHaveBeenCalledWith("worker-1", "worker", false);
			expect(mocks.monitorsRepository.findAllForScheduling).not.toHaveBeenCalled();
			expect(mocks.jobsRepository.upsertJob).not.toHaveBeenCalled();
			expect(mocks.jobsRepository.upsertCleanupJob).not.toHaveBeenCalled();
		});

		it("primary mode seeds the telemetry row when telemetry is enabled", async () => {
			const now = Date.now();
			const { scheduler, mocks } = createScheduler({ queueMode: "primary", telemetryEnabled: true });
			await scheduler.init();

			const telemetryCall = mocks.jobsRepository.upsertJob.mock.calls.find((c: any[]) => c[0].type === "telemetry");
			expect(telemetryCall).toBeDefined();
			const seed = telemetryCall![0] as any;
			expect(seed).toMatchObject({ id: "telemetry", refId: null, isActive: true, intervalMs: 24 * 60 * 60 * 1000 });
			expect(seed.nextScheduledAt).toBeGreaterThanOrEqual(now);
			expect(seed.nextScheduledAt).toBeLessThan(now + 60 * 60 * 1000);
			expect(mocks.jobsRepository.deleteGlobalJob).not.toHaveBeenCalled();
		});

		it("primary mode removes the telemetry row when telemetry is disabled", async () => {
			const { scheduler, mocks } = createScheduler({ queueMode: "primary", telemetryEnabled: false });
			await scheduler.init();

			const seededTypes = mocks.jobsRepository.upsertJob.mock.calls.map((c: any[]) => c[0].type);
			expect(seededTypes).not.toContain("telemetry");
			expect(mocks.jobsRepository.deleteGlobalJob).toHaveBeenCalledWith("telemetry");
		});

		it("worker mode never touches the telemetry row", async () => {
			const { scheduler, mocks } = createScheduler({ queueMode: "worker", telemetryEnabled: true });
			await scheduler.init();

			expect(mocks.jobsRepository.upsertJob).not.toHaveBeenCalled();
			expect(mocks.jobsRepository.deleteGlobalJob).not.toHaveBeenCalled();
		});

		it("arms a heartbeat interval timer that shutdown() clears and deregisters", async () => {
			const { scheduler, mocks } = createScheduler({ queueMode: "primary" });
			await scheduler.init();
			expect((scheduler as any).timers.has("heartbeat")).toBe(true);

			await scheduler.shutdown();
			expect((scheduler as any).timers.has("heartbeat")).toBe(false);
			expect(mocks.queueWorkersRepository.deleteById).toHaveBeenCalledWith("worker-1");
		});

		it("primary mode re-arms only heartbeat rows that went overdue while down", async () => {
			const monitors = [makeMonitor({ id: "hb1", type: "heartbeat" }), makeMonitor({ id: "m1" }), makeMonitor({ id: "hb2", type: "heartbeat" })];
			const { scheduler, mocks } = createScheduler({
				queueMode: "primary",
				mocks: { monitorsRepository: { findAllForScheduling: jest.fn<any>().mockResolvedValue(monitors) } },
			});
			await scheduler.init();

			expect(mocks.jobsRepository.rescheduleOverdueChecks).toHaveBeenCalledTimes(1);
			expect(mocks.jobsRepository.rescheduleOverdueChecks).toHaveBeenCalledWith(["hb1", "hb2"], Date.now());
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

	describe("addJob", () => {
		it("preserves an arbitrary monitor interval in the scheduled job", async () => {
			const { scheduler, mocks } = createScheduler();

			await scheduler.addJob("m1", makeMonitor({ interval: 75000 }));

			expect(mocks.jobsRepository.upsertJob).toHaveBeenCalledWith(
				expect.objectContaining({
					id: "check:m1",
					intervalMs: 75000,
				})
			);
		});
	});

	// Heartbeat rows are dead man's switches: the deadline is one interval out, and nothing
	// should make the row due early, or the switch fires before the job has had a chance to ping.
	describe("heartbeat scheduling", () => {
		const NOW = 1_000_000;

		beforeEach(() => {
			jest.useFakeTimers({ now: NOW });
		});

		afterEach(() => {
			jest.useRealTimers();
		});

		it("addJob seeds a heartbeat row one interval out and does not wake the check loop", async () => {
			const { scheduler, mocks } = createScheduler();
			const wake = jest.spyOn(scheduler, "wake");

			await scheduler.addJob("hb1", makeMonitor({ id: "hb1", type: "heartbeat", interval: 120000 }));

			expect(mocks.jobsRepository.upsertJob).toHaveBeenCalledWith(expect.objectContaining({ id: "check:hb1", nextScheduledAt: NOW + 120000 }));
			expect(wake).not.toHaveBeenCalled();
		});

		it("addJob seeds a probe row due now and wakes the check loop", async () => {
			const { scheduler, mocks } = createScheduler();
			const wake = jest.spyOn(scheduler, "wake");

			await scheduler.addJob("m1", makeMonitor());

			expect(mocks.jobsRepository.upsertJob).toHaveBeenCalledWith(expect.objectContaining({ id: "check:m1", nextScheduledAt: NOW }));
			expect(wake).toHaveBeenCalledWith("check");
		});

		it("resumeJob re-arms an overdue heartbeat row before activating it, without waking", async () => {
			const { scheduler, mocks } = createScheduler();
			const wake = jest.spyOn(scheduler, "wake");

			await scheduler.resumeJob(makeMonitor({ id: "hb1", type: "heartbeat" }));

			const { rescheduleOverdueChecks, setActiveById } = mocks.jobsRepository;
			expect(rescheduleOverdueChecks).toHaveBeenCalledWith(["hb1"], NOW);
			expect(setActiveById).toHaveBeenCalledWith("hb1", true);
			// Activating first would leave an active, overdue row for a worker to claim
			expect(rescheduleOverdueChecks.mock.invocationCallOrder[0]).toBeLessThan(setActiveById.mock.invocationCallOrder[0]);
			expect(wake).not.toHaveBeenCalled();
		});

		it("resumeJob activates a probe row and wakes the check loop without re-arming", async () => {
			const { scheduler, mocks } = createScheduler();
			const wake = jest.spyOn(scheduler, "wake");

			await scheduler.resumeJob(makeMonitor());

			expect(mocks.jobsRepository.setActiveById).toHaveBeenCalledWith("m1", true);
			expect(mocks.jobsRepository.rescheduleOverdueChecks).not.toHaveBeenCalled();
			expect(wake).toHaveBeenCalledWith("check");
		});

		it("updateJob shifts a heartbeat deadline with the interval instead of only changing the interval", async () => {
			const { scheduler, mocks } = createScheduler();

			await scheduler.updateJob(makeMonitor({ id: "hb1", type: "heartbeat", interval: 120000 }));

			expect(mocks.jobsRepository.updateHeartbeatScheduleById).toHaveBeenCalledWith("hb1", 120000);
			expect(mocks.jobsRepository.updateScheduleById).not.toHaveBeenCalled();
		});

		it("updateJob changes only the interval on a probe row", async () => {
			const { scheduler, mocks } = createScheduler();

			await scheduler.updateJob(makeMonitor({ interval: 120000 }));

			expect(mocks.jobsRepository.updateScheduleById).toHaveBeenCalledWith("m1", "check", 120000);
			expect(mocks.jobsRepository.updateHeartbeatScheduleById).not.toHaveBeenCalled();
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
