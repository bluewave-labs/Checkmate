import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { EgressService } from "../../../src/domain/egress/egress.service.ts";
import type { EgressState } from "../../../src/domain/egress/egress.type.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeState = (overrides?: Partial<EgressState>): EgressState => ({
	id: "egress-1",
	status: "ok",
	degradedSince: null,
	lastRecoveredAt: null,
	lastProbeAt: null,
	lastProbeResults: [],
	createdAt: "2026-01-01T00:00:00.000Z",
	updatedAt: "2026-01-01T00:00:00.000Z",
	...overrides,
});

const makeSettings = (overrides?: Record<string, unknown>) => ({
	egressCheckEnabled: true,
	egressCheckTargets: ["1.1.1.1", "8.8.8.8"],
	egressPollIntervalSeconds: 30,
	egressNotifications: ["notif-1"],
	...overrides,
});

// requestStatus mock that answers per target url
const statusFor = (reachableTargets: string[]) =>
	jest.fn().mockImplementation(async (monitor: any) => ({
		monitorId: monitor.id,
		teamId: monitor.teamId,
		type: monitor.type,
		status: reachableTargets.includes(monitor.url),
		code: reachableTargets.includes(monitor.url) ? 200 : 5000,
		message: reachableTargets.includes(monitor.url) ? "Success" : "Ping failed",
		responseTime: 12,
	}));

const createService = (overrides?: Record<string, any>) => {
	const defaults = {
		settingsService: { getDBSettings: jest.fn().mockResolvedValue(makeSettings()) },
		egressStateRepository: {
			findSingleton: jest.fn().mockResolvedValue(makeState()),
			recordProbe: jest.fn().mockResolvedValue(makeState()),
			markDegraded: jest.fn().mockResolvedValue(makeState({ status: "degraded", degradedSince: "2026-01-01T10:00:00.000Z" })),
			markRecovered: jest.fn().mockResolvedValue(makeState({ lastRecoveredAt: "2026-01-01T10:05:00.000Z" })),
		},
		jobsRepository: {
			upsertJob: jest.fn().mockResolvedValue(true),
			deleteByIdAndType: jest.fn().mockResolvedValue(true),
		},
		networkService: { requestStatus: statusFor(["1.1.1.1", "8.8.8.8"]) },
		logger: createMockLogger(),
		...overrides,
	};
	const service = new EgressService(
		defaults.settingsService as any,
		defaults.egressStateRepository as any,
		defaults.jobsRepository as any,
		defaults.networkService as any,
		defaults.logger as any
	);
	return { service, defaults };
};

const degradedRepository = (overrides?: Record<string, any>) => ({
	findSingleton: jest.fn().mockResolvedValue(makeState({ status: "degraded", degradedSince: "2026-01-01T10:00:00.000Z" })),
	recordProbe: jest.fn().mockResolvedValue(makeState({ status: "degraded" })),
	markDegraded: jest.fn().mockResolvedValue(null),
	markRecovered: jest.fn().mockResolvedValue(makeState({ lastRecoveredAt: "2026-01-01T10:05:00.000Z", degradedSince: "2026-01-01T10:00:00.000Z" })),
	...overrides,
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("EgressService", () => {
	afterEach(() => {
		jest.useRealTimers();
	});

	// ── probeTargets ──────────────────────────────────────────────────────────

	describe("probeTargets", () => {
		it("maps a bare host to a ping monitor, host:port to a port monitor and a URL to an http monitor", async () => {
			const { service, defaults } = createService();

			await service.probeTargets(["1.1.1.1", "8.8.8.8:53", "https://example.com/health", "[2606:4700::1111]:443"]);

			const monitors = (defaults.networkService.requestStatus as jest.Mock).mock.calls.map((call) => call[0] as any);
			expect(monitors).toEqual([
				expect.objectContaining({ type: "ping", url: "1.1.1.1" }),
				expect.objectContaining({ type: "port", url: "8.8.8.8", port: 53 }),
				expect.objectContaining({ type: "http", url: "https://example.com/health", method: "GET", useAdvancedMatching: false }),
				expect.objectContaining({ type: "port", url: "2606:4700::1111", port: 443 }),
			]);
		});

		it("reports reachable only when the provider says status is true", async () => {
			const { service } = createService({ networkService: { requestStatus: statusFor(["1.1.1.1"]) } });

			const results = await service.probeTargets(["1.1.1.1", "8.8.8.8"]);

			expect(results).toEqual([
				expect.objectContaining({ target: "1.1.1.1", reachable: true, responseTime: 12 }),
				expect.objectContaining({ target: "8.8.8.8", reachable: false }),
			]);
		});

		it("counts a thrown provider error as unreachable", async () => {
			const { service } = createService({ networkService: { requestStatus: jest.fn().mockRejectedValue(new Error("ENETUNREACH")) } });

			const results = await service.probeTargets(["1.1.1.1"]);

			expect(results).toEqual([expect.objectContaining({ target: "1.1.1.1", reachable: false, message: "ENETUNREACH" })]);
		});

		it("counts a hung provider as unreachable once the probe timeout elapses", async () => {
			jest.useFakeTimers();
			const { service } = createService({ networkService: { requestStatus: jest.fn().mockReturnValue(new Promise(() => {})) } });

			const pending = service.probeTargets(["1.1.1.1"]);
			await jest.advanceTimersByTimeAsync(5000);
			const results = await pending;

			expect(results).toEqual([expect.objectContaining({ target: "1.1.1.1", reachable: false, message: expect.stringContaining("timed out") })]);
		});
	});

	// ── assessAfterFailure ────────────────────────────────────────────────────

	describe("assessAfterFailure", () => {
		it("returns null and does not probe or record when the feature is disabled", async () => {
			const { service, defaults } = createService({
				settingsService: { getDBSettings: jest.fn().mockResolvedValue(makeSettings({ egressCheckEnabled: false })) },
			});

			const result = await service.assessAfterFailure();

			expect(result).toBeNull();
			expect(defaults.networkService.requestStatus).not.toHaveBeenCalled();
			expect(defaults.egressStateRepository.findSingleton).not.toHaveBeenCalled();
			expect(defaults.egressStateRepository.recordProbe).not.toHaveBeenCalled();
		});

		it("returns ok and records the probe when any target is reachable", async () => {
			const { service, defaults } = createService({ networkService: { requestStatus: statusFor(["8.8.8.8"]) } });

			const result = await service.assessAfterFailure();

			expect(result).toBe("ok");
			expect(defaults.egressStateRepository.recordProbe).toHaveBeenCalledWith(
				[expect.objectContaining({ target: "1.1.1.1", reachable: false }), expect.objectContaining({ target: "8.8.8.8", reachable: true })],
				expect.any(Date)
			);
			expect(defaults.egressStateRepository.markDegraded).not.toHaveBeenCalled();
		});

		it("marks degraded, warns, inserts the recovery job and returns degraded when every target is unreachable", async () => {
			const { service, defaults } = createService({ networkService: { requestStatus: statusFor([]) } });

			const result = await service.assessAfterFailure();

			expect(result).toBe("degraded");
			expect(defaults.egressStateRepository.markDegraded).toHaveBeenCalledWith(
				[expect.objectContaining({ target: "1.1.1.1", reachable: false }), expect.objectContaining({ target: "8.8.8.8", reachable: false })],
				expect.any(Date)
			);
			expect(defaults.egressStateRepository.recordProbe).not.toHaveBeenCalled();
			expect(defaults.logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("egress degraded") }));
			expect(defaults.jobsRepository.upsertJob).toHaveBeenCalledWith({
				id: "egress",
				type: "egress",
				refId: null,
				isActive: true,
				nextScheduledAt: expect.any(Number),
				intervalMs: 30_000,
			});
		});

		it("returns degraded without probing when the persisted state is already degraded, re-arming the recovery job", async () => {
			const { service, defaults } = createService({ egressStateRepository: degradedRepository() });

			const result = await service.assessAfterFailure();

			expect(result).toBe("degraded");
			expect(defaults.networkService.requestStatus).not.toHaveBeenCalled();
			expect(defaults.egressStateRepository.markDegraded).not.toHaveBeenCalled();
			expect(defaults.egressStateRepository.recordProbe).not.toHaveBeenCalled();
			expect(defaults.jobsRepository.upsertJob).toHaveBeenCalledWith(expect.objectContaining({ id: "egress", intervalMs: 30_000 }));
		});

		it("uses the default poll interval for the recovery job when the setting is missing or invalid", async () => {
			const { service, defaults } = createService({
				settingsService: { getDBSettings: jest.fn().mockResolvedValue(makeSettings({ egressPollIntervalSeconds: undefined })) },
				networkService: { requestStatus: statusFor([]) },
			});

			await service.assessAfterFailure();

			expect(defaults.jobsRepository.upsertJob).toHaveBeenCalledWith(expect.objectContaining({ intervalMs: 30_000 }));
		});

		it("shares one probe between concurrent failures", async () => {
			const { service, defaults } = createService({ networkService: { requestStatus: statusFor(["8.8.8.8"]) } });

			const results = await Promise.all([service.assessAfterFailure(), service.assessAfterFailure(), service.assessAfterFailure()]);

			expect(results).toEqual(["ok", "ok", "ok"]);
			expect(defaults.settingsService.getDBSettings).toHaveBeenCalledTimes(1);
			expect(defaults.networkService.requestStatus).toHaveBeenCalledTimes(2); // one call per target, once
			expect(defaults.egressStateRepository.recordProbe).toHaveBeenCalledTimes(1);
		});

		it("reuses a settled assessment within the cache window and probes again after it", async () => {
			jest.useFakeTimers();
			const { service, defaults } = createService({ networkService: { requestStatus: statusFor(["8.8.8.8"]) } });

			await service.assessAfterFailure();
			await jest.advanceTimersByTimeAsync(1000);
			await service.assessAfterFailure();
			expect(defaults.egressStateRepository.recordProbe).toHaveBeenCalledTimes(1);

			await jest.advanceTimersByTimeAsync(5000);
			await service.assessAfterFailure();
			expect(defaults.egressStateRepository.recordProbe).toHaveBeenCalledTimes(2);
		});

		it("does not cache an internal failure", async () => {
			const getDBSettings = jest.fn().mockRejectedValueOnce(new Error("db down")).mockResolvedValue(makeSettings());
			const { service, defaults } = createService({ settingsService: { getDBSettings } });

			expect(await service.assessAfterFailure()).toBeNull();
			expect(await service.assessAfterFailure()).toBe("ok");
			expect(defaults.egressStateRepository.recordProbe).toHaveBeenCalledTimes(1);
		});

		it("falls back to the default targets when the configured list is empty", async () => {
			const { service, defaults } = createService({
				settingsService: { getDBSettings: jest.fn().mockResolvedValue(makeSettings({ egressCheckTargets: [] })) },
			});

			await service.assessAfterFailure();

			const urls = (defaults.networkService.requestStatus as jest.Mock).mock.calls.map((call) => (call[0] as any).url);
			expect(urls).toEqual(["1.1.1.1", "8.8.8.8"]);
		});

		it("returns null and logs when the assessment itself fails", async () => {
			const { service, defaults } = createService({
				settingsService: { getDBSettings: jest.fn().mockRejectedValue(new Error("db down")) },
			});

			const result = await service.assessAfterFailure();

			expect(result).toBeNull();
			expect(defaults.logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: "db down", method: "assessAfterFailure" }));
		});
	});

	// ── checkRecovery (the "egress" job) ──────────────────────────────────────

	describe("checkRecovery", () => {
		it("marks recovered, removes the job and logs when a target becomes reachable", async () => {
			const { service, defaults } = createService({
				egressStateRepository: degradedRepository(),
				networkService: { requestStatus: statusFor(["1.1.1.1"]) },
			});

			await service.checkRecovery();

			expect(defaults.egressStateRepository.markRecovered).toHaveBeenCalledWith(
				[expect.objectContaining({ target: "1.1.1.1", reachable: true }), expect.objectContaining({ target: "8.8.8.8", reachable: false })],
				expect.any(Date)
			);
			expect(defaults.jobsRepository.deleteByIdAndType).toHaveBeenCalledWith(null, "egress");
			expect(defaults.logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("Instance egress recovered") }));
		});

		it("removes the job but does not log a recovery when another process already recorded it", async () => {
			const { service, defaults } = createService({
				egressStateRepository: degradedRepository({ markRecovered: jest.fn().mockResolvedValue(null) }),
				networkService: { requestStatus: statusFor(["1.1.1.1"]) },
			});

			await service.checkRecovery();

			expect(defaults.jobsRepository.deleteByIdAndType).toHaveBeenCalledWith(null, "egress");
			expect(defaults.logger.info).not.toHaveBeenCalledWith(
				expect.objectContaining({ message: expect.stringContaining("Instance egress recovered") })
			);
		});

		it("records the probe and keeps the job while every target stays unreachable", async () => {
			const { service, defaults } = createService({
				egressStateRepository: degradedRepository(),
				networkService: { requestStatus: statusFor([]) },
			});

			await service.checkRecovery();

			expect(defaults.egressStateRepository.recordProbe).toHaveBeenCalledTimes(1);
			expect(defaults.egressStateRepository.markRecovered).not.toHaveBeenCalled();
			expect(defaults.jobsRepository.deleteByIdAndType).not.toHaveBeenCalled();
		});

		it("removes the job without probing when the persisted state is no longer degraded", async () => {
			const { service, defaults } = createService();

			await service.checkRecovery();

			expect(defaults.networkService.requestStatus).not.toHaveBeenCalled();
			expect(defaults.egressStateRepository.markRecovered).not.toHaveBeenCalled();
			expect(defaults.jobsRepository.deleteByIdAndType).toHaveBeenCalledWith(null, "egress");
		});

		it("lets errors propagate so the queue records the failure and retries", async () => {
			const { service } = createService({
				egressStateRepository: degradedRepository({ findSingleton: jest.fn().mockRejectedValue(new Error("db down")) }),
			});

			await expect(service.checkRecovery()).rejects.toThrow("db down");
		});
	});
});
