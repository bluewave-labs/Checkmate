import { describe, expect, it, jest } from "@jest/globals";
import { JobScheduler } from "../../../src/worker/worker.job-scheduler.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

// ── Notes ──────────────────────────────────────────────────────────────────────
//
// JobScheduler is the scheduler-only primary base class: it owns the queue
// registry/heartbeat but processes no jobs and has no buffer. drain() is therefore
// a no-op beyond setting the stop flag — it must NOT tear down (clear timers or
// deregister the worker); that stays in shutdown(). The real draining (wait for
// in-flight, flush buffer) lives in DBQueueWorker and is covered separately.

const createScheduler = () => {
	const jobsRepository = {} as any;
	const queueWorkersRepository = {
		deleteById: jest.fn<any>().mockResolvedValue(undefined),
	};
	const logger = createMockLogger();
	const scheduler = new JobScheduler(jobsRepository, queueWorkersRepository as any, "worker-1");
	return { scheduler, mocks: { jobsRepository, queueWorkersRepository, logger } };
};

describe("JobScheduler", () => {
	describe("drain", () => {
		it("sets the stop flag without tearing down (no deregister)", async () => {
			const { scheduler, mocks } = createScheduler();

			await scheduler.drain();

			expect((scheduler as any).stopped).toBe(true);
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
});
