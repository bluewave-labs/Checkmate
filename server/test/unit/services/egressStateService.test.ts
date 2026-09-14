import { describe, expect, it, jest } from "@jest/globals";
import { EgressStateService } from "../../../src/domain/egress/egress-state.service.ts";
import type { EgressState } from "../../../src/domain/egress/egress.type.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const createEgressStateRepo = () => ({
	findSingleton: jest.fn(),
	recordProbe: jest.fn(),
	markDegraded: jest.fn(),
	markRecovered: jest.fn(),
});

const createService = () => {
	const egressStateRepository = createEgressStateRepo();
	const service = new EgressStateService(egressStateRepository as any);
	return { service, egressStateRepository };
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
	describe("getState", () => {
		it("returns the singleton state from the repository", async () => {
			const { service, egressStateRepository } = createService();
			const state = makeState({
				status: "degraded",
				degradedSince: "2026-01-01T00:05:00Z",
				lastProbeAt: "2026-01-01T00:05:00Z",
				lastProbeResults: [{ target: "1.1.1.1", reachable: false, responseTime: 0, message: "timeout" }],
			});
			(egressStateRepository.findSingleton as jest.Mock).mockResolvedValue(state);

			const result = await service.getState();

			expect(egressStateRepository.findSingleton).toHaveBeenCalledTimes(1);
			expect(result).toEqual(state);
		});

		it("does not call any transition method", async () => {
			const { service, egressStateRepository } = createService();
			(egressStateRepository.findSingleton as jest.Mock).mockResolvedValue(makeState());

			await service.getState();

			expect(egressStateRepository.recordProbe).not.toHaveBeenCalled();
			expect(egressStateRepository.markDegraded).not.toHaveBeenCalled();
			expect(egressStateRepository.markRecovered).not.toHaveBeenCalled();
		});

		it("propagates repository errors", async () => {
			const { service, egressStateRepository } = createService();
			(egressStateRepository.findSingleton as jest.Mock).mockRejectedValue(new Error("db down"));

			await expect(service.getState()).rejects.toThrow("db down");
		});
	});
});
