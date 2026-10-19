import { describe, expect, it, jest } from "@jest/globals";
import { EgressStateService } from "../../../src/domain/egress/egress-state.service.ts";
import type { EgressState } from "../../../src/domain/egress/egress.type.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const createEgressStateRepo = () => ({
	findSingleton: jest.fn(),
	recordProbe: jest.fn(),
	markDegraded: jest.fn(),
	markRecovered: jest.fn(),
	reset: jest.fn(),
});

const createJobsRepo = () => ({
	deleteGlobalJob: jest.fn().mockResolvedValue(true),
});

const createSettingsService = (egressCheckEnabled = true) => ({
	getCachedDBSettings: jest.fn().mockResolvedValue({ egressCheckEnabled }),
});

const createService = (egressCheckEnabled = true) => {
	const egressStateRepository = createEgressStateRepo();
	const jobsRepository = createJobsRepo();
	const settingsService = createSettingsService(egressCheckEnabled);
	const service = new EgressStateService(egressStateRepository as any, jobsRepository as any, settingsService as any);
	return { service, egressStateRepository, jobsRepository, settingsService };
};

const makeState = (overrides?: Partial<EgressState>): EgressState => ({
	id: "egress-1",
	status: "ok",
	degradedSince: null,
	lastRecoveredAt: null,
	lastProbeAt: null,
	lastProbeResults: [],
	createdAt: "2026-01-01T00:00:00Z",
	updatedAt: "2026-01-01T00:00:00Z",
	...overrides,
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("EgressStateService", () => {
	describe("getSummary", () => {
		it("returns only enabled, status and degradedSince", async () => {
			const { service, egressStateRepository } = createService();
			const state = makeState({
				status: "degraded",
				degradedSince: "2026-01-01T00:05:00Z",
				lastProbeAt: "2026-01-01T00:05:00Z",
				lastProbeResults: [{ target: "https://internal.example.com", reachable: false, responseTime: 0, message: "timeout" }],
			});
			(egressStateRepository.findSingleton as jest.Mock).mockResolvedValue(state);

			const result = await service.getSummary();

			expect(egressStateRepository.findSingleton).toHaveBeenCalledTimes(1);
			expect(result).toEqual({ enabled: true, status: "degraded", degradedSince: "2026-01-01T00:05:00Z" });
		});

		it("reports enabled false when the self-check is switched off", async () => {
			const { service, egressStateRepository } = createService(false);
			(egressStateRepository.findSingleton as jest.Mock).mockResolvedValue(makeState());

			const result = await service.getSummary();

			expect(result).toEqual({ enabled: false, status: "ok", degradedSince: null });
		});

		it("does not call any transition method", async () => {
			const { service, egressStateRepository } = createService();
			(egressStateRepository.findSingleton as jest.Mock).mockResolvedValue(makeState());

			await service.getSummary();

			expect(egressStateRepository.recordProbe).not.toHaveBeenCalled();
			expect(egressStateRepository.markDegraded).not.toHaveBeenCalled();
			expect(egressStateRepository.markRecovered).not.toHaveBeenCalled();
		});

		it("propagates repository errors", async () => {
			const { service, egressStateRepository } = createService();
			(egressStateRepository.findSingleton as jest.Mock).mockRejectedValue(new Error("db down"));

			await expect(service.getSummary()).rejects.toThrow("db down");
		});
	});

	describe("reset", () => {
		it("removes any pending recovery job and returns the state to ok", async () => {
			const { service, egressStateRepository, jobsRepository } = createService();
			const reset = makeState();
			(egressStateRepository.reset as jest.Mock).mockResolvedValue(reset);

			const result = await service.reset();

			expect(jobsRepository.deleteGlobalJob).toHaveBeenCalledWith("egress");
			expect(egressStateRepository.reset).toHaveBeenCalledTimes(1);
			expect(result).toEqual(reset);
		});

		it("does not touch the probe-driven transitions", async () => {
			const { service, egressStateRepository } = createService();
			(egressStateRepository.reset as jest.Mock).mockResolvedValue(makeState());

			await service.reset();

			expect(egressStateRepository.markDegraded).not.toHaveBeenCalled();
			expect(egressStateRepository.markRecovered).not.toHaveBeenCalled();
		});
	});
});
