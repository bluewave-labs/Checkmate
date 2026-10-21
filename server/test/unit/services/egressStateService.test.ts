import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { EgressStateService } from "../../../src/domain/egress/egress-state.service.ts";
import { BANNER_FRESHNESS_MS } from "../../../src/domain/egress/egress.type.ts";
import { WORKER_STALE_MS } from "../../../src/domain/queue-workers/queue-worker.model.ts";
import type { QueueWorker, WorkerEgress } from "../../../src/domain/queue-workers/queue-worker.type.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const NOW = 1_760_000_000_000;

const makeEgress = (overrides?: Partial<WorkerEgress>): WorkerEgress => ({
	status: "degraded",
	checkedAt: NOW - 1_000,
	degradedSince: NOW - 30_000,
	lastProbeResults: [],
	...overrides,
});

const makeWorker = (workerId: string, overrides?: Partial<QueueWorker>): QueueWorker => ({
	workerId,
	mode: "worker",
	processesJobs: true,
	lastSeenAt: NOW - 1_000,
	...overrides,
});

const createService = (workers: QueueWorker[], egressCheckEnabled = true) => {
	const queueWorkersRepository = { findRecent: jest.fn().mockResolvedValue(workers) };
	const settingsService = { getCachedDBSettings: jest.fn().mockResolvedValue({ egressCheckEnabled }) };
	const service = new EgressStateService(queueWorkersRepository as any, settingsService as any);
	return { service, queueWorkersRepository, settingsService };
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("EgressStateService", () => {
	afterEach(() => {
		jest.useRealTimers();
	});

	describe("getSummary", () => {
		const setup = (workers: QueueWorker[], egressCheckEnabled = true) => {
			jest.useFakeTimers();
			jest.setSystemTime(NOW);
			return createService(workers, egressCheckEnabled);
		};

		it("reads the workers seen within WORKER_STALE_MS", async () => {
			const { service, queueWorkersRepository } = setup([]);

			await service.getSummary();

			expect(queueWorkersRepository.findRecent).toHaveBeenCalledWith(WORKER_STALE_MS);
		});

		it("reports ok and 0 of 0 when there are no workers", async () => {
			const { service } = setup([]);

			expect(await service.getSummary()).toEqual({ enabled: true, status: "ok", degradedSince: null, degradedWorkers: 0, totalWorkers: 0 });
		});

		it("reports one fresh degraded worker with its degradedSince as ISO", async () => {
			const { service } = setup([makeWorker("worker-1", { egress: makeEgress() })]);

			expect(await service.getSummary()).toEqual({
				enabled: true,
				status: "degraded",
				degradedSince: new Date(NOW - 30_000).toISOString(),
				degradedWorkers: 1,
				totalWorkers: 1,
			});
		});

		it("ignores a degraded verdict older than BANNER_FRESHNESS_MS", async () => {
			const { service } = setup([makeWorker("worker-1", { egress: makeEgress({ checkedAt: NOW - BANNER_FRESHNESS_MS }) })]);

			expect(await service.getSummary()).toEqual(expect.objectContaining({ status: "ok", degradedSince: null, degradedWorkers: 0, totalWorkers: 1 }));
		});

		it("excludes workers that do not process jobs from both counts", async () => {
			const { service } = setup([
				makeWorker("api-1", { processesJobs: false, egress: makeEgress() }),
				makeWorker("worker-1", { egress: makeEgress({ status: "ok", degradedSince: null }) }),
			]);

			expect(await service.getSummary()).toEqual(expect.objectContaining({ status: "ok", degradedWorkers: 0, totalWorkers: 1 }));
		});

		it("counts workers without a verdict toward the total only", async () => {
			const { service } = setup([makeWorker("worker-1", { egress: makeEgress() }), makeWorker("worker-2")]);

			expect(await service.getSummary()).toEqual(expect.objectContaining({ status: "degraded", degradedWorkers: 1, totalWorkers: 2 }));
		});

		it("reports the earliest degradedSince across degraded workers", async () => {
			const { service } = setup([
				makeWorker("worker-1", { egress: makeEgress({ degradedSince: NOW - 10_000 }) }),
				makeWorker("worker-2", { egress: makeEgress({ degradedSince: NOW - 50_000 }) }),
				makeWorker("worker-3", { egress: makeEgress({ degradedSince: NOW - 20_000 }) }),
			]);

			expect(await service.getSummary()).toEqual(
				expect.objectContaining({ degradedSince: new Date(NOW - 50_000).toISOString(), degradedWorkers: 3, totalWorkers: 3 })
			);
		});

		it("reports enabled from the settings", async () => {
			const { service } = setup([], false);

			expect(await service.getSummary()).toEqual(expect.objectContaining({ enabled: false }));
		});

		it("propagates repository errors", async () => {
			const { service, queueWorkersRepository } = setup([]);
			queueWorkersRepository.findRecent.mockRejectedValue(new Error("db down"));

			await expect(service.getSummary()).rejects.toThrow("db down");
		});
	});
});
