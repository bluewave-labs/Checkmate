import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { EgressService } from "../../../src/domain/egress/egress.service.ts";
import type { EgressState } from "../../../src/domain/egress/egress.type.ts";
import type { Job } from "../../../src/domain/jobs/job.type.ts";
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
	egressNotifications: ["notif-1"],
	...overrides,
});

// The claimed "egress" job row as the queue hands it to the handler
const makeJob = (overrides?: Partial<Job>): Job => ({
	id: "egress",
	type: "egress",
	refId: null,
	isActive: true,
	nextScheduledAt: 1_000,
	intervalMs: 5_000,
	lockedBy: "worker-1",
	lockedUntil: 61_000,
	runCount: 0,
	failCount: 0,
	lastFinishedAt: null,
	lastFailReason: null,
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

const degradedRepository = (overrides?: Record<string, any>) => ({
	findSingleton: jest.fn().mockResolvedValue(makeState({ status: "degraded", degradedSince: "2026-01-01T10:00:00.000Z" })),
	recordProbe: jest.fn().mockResolvedValue(makeState({ status: "degraded" })),
	markDegraded: jest.fn().mockResolvedValue(null),
	markRecovered: jest.fn().mockResolvedValue(makeState({ lastRecoveredAt: "2026-01-01T10:05:00.000Z", degradedSince: "2026-01-01T10:00:00.000Z" })),
	reset: jest.fn(),
	...overrides,
});

const createService = (overrides?: Record<string, any>) => {
	const defaults = {
		settingsService: { getCachedDBSettings: jest.fn().mockResolvedValue(makeSettings()) },
		egressStateRepository: {
			findSingleton: jest.fn().mockResolvedValue(makeState()),
			recordProbe: jest.fn().mockResolvedValue(makeState()),
			markDegraded: jest.fn().mockResolvedValue(makeState({ status: "degraded", degradedSince: "2026-01-01T10:00:00.000Z" })),
			markRecovered: jest.fn().mockResolvedValue(makeState({ lastRecoveredAt: "2026-01-01T10:05:00.000Z" })),
			reset: jest.fn(),
		},
		jobsRepository: {
			upsertJob: jest.fn().mockResolvedValue(true),
			upsertCleanupJob: jest.fn().mockResolvedValue(true),
			deleteGlobalJobIfUnchanged: jest.fn().mockResolvedValue(true),
		},
		networkService: { requestStatus: statusFor(["1.1.1.1", "8.8.8.8"]) },
		proxyResolver: { resolve: jest.fn().mockResolvedValue(undefined) },
		logger: createMockLogger(),
		...overrides,
	};
	const service = new EgressService(
		defaults.settingsService as any,
		defaults.egressStateRepository as any,
		defaults.jobsRepository as any,
		defaults.networkService as any,
		defaults.proxyResolver as any,
		defaults.logger as any
	);
	return { service, defaults };
};

const probedUrls = (defaults: { networkService: { requestStatus: unknown } }) =>
	(defaults.networkService.requestStatus as jest.Mock).mock.calls.map((call) => (call[0] as any).url);

// ── Tests ────────────────────────────────────────────────────────────────────

describe("EgressService", () => {
	afterEach(() => {
		jest.useRealTimers();
	});

	// ── probeTargets ──────────────────────────────────────────────────────────

	describe("probeTargets", () => {
		it("maps a bare host to a ping monitor, host:port to a port monitor and a URL to an http monitor", async () => {
			const { service, defaults } = createService();

			await service.probeTargets(["1.1.1.1", "8.8.8.8:53", "https://example.com/health", "[2606:4700::1111]:443", "2606:4700::1111"]);

			const monitors = (defaults.networkService.requestStatus as jest.Mock).mock.calls.map((call) => call[0] as any);
			expect(monitors).toEqual([
				expect.objectContaining({ type: "ping", url: "1.1.1.1" }),
				expect.objectContaining({ type: "port", url: "8.8.8.8", port: 53 }),
				expect.objectContaining({ type: "http", url: "https://example.com/health", method: "GET", useAdvancedMatching: false }),
				expect.objectContaining({ type: "port", url: "2606:4700::1111", port: 443 }),
				expect.objectContaining({ type: "ping", url: "2606:4700::1111" }),
			]);
		});

		it("passes the resolved proxy to the provider so http probes honour the global proxy", async () => {
			const resolve = jest.fn().mockResolvedValue("http://proxy.internal:3128");
			const { service, defaults } = createService({ proxyResolver: { resolve } });

			await service.probeTargets(["https://example.com/health"]);

			expect(resolve).toHaveBeenCalledWith(expect.objectContaining({ type: "http", proxyMode: "inherit" }));
			expect(defaults.networkService.requestStatus).toHaveBeenCalledWith(expect.objectContaining({ type: "http" }), {
				proxyUrl: "http://proxy.internal:3128",
			});
		});

		it("reports reachable only when the provider says status is true", async () => {
			const { service } = createService({ networkService: { requestStatus: statusFor(["1.1.1.1"]) } });

			const results = await service.probeTargets(["1.1.1.1", "8.8.8.8"]);

			expect(results).toEqual([
				expect.objectContaining({ target: "1.1.1.1", reachable: true, responseTime: 12 }),
				expect.objectContaining({ target: "8.8.8.8", reachable: false }),
			]);
		});

		it("treats any HTTP response, even 4xx/5xx, as reachable but a transport failure as unreachable", async () => {
			const requestStatus = jest.fn().mockImplementation(async (monitor: any) => ({
				monitorId: monitor.id,
				teamId: monitor.teamId,
				type: monitor.type,
				status: false,
				code: monitor.url.includes("maintenance") ? 503 : 5000, // 5000 is HttpProvider's NETWORK_ERROR
				message: monitor.url.includes("maintenance") ? "Service Unavailable" : "ECONNREFUSED",
				responseTime: 3,
			}));
			const { service } = createService({ networkService: { requestStatus } });

			const results = await service.probeTargets(["https://example.com/maintenance", "https://example.com/refused", "8.8.8.8:53"]);

			expect(results).toEqual([
				expect.objectContaining({ target: "https://example.com/maintenance", reachable: true }),
				expect.objectContaining({ target: "https://example.com/refused", reachable: false }),
				expect.objectContaining({ target: "8.8.8.8:53", reachable: false }), // non-http: only status true counts
			]);
		});

		it("counts an unparseable stored target as unreachable without probing", async () => {
			const { service, defaults } = createService();

			const results = await service.probeTargets(["[1.1.1.1"]);

			expect(results).toEqual([expect.objectContaining({ target: "[1.1.1.1", reachable: false, message: "Invalid egress target" })]);
			expect(defaults.networkService.requestStatus).not.toHaveBeenCalled();
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
				settingsService: { getCachedDBSettings: jest.fn().mockResolvedValue(makeSettings({ egressCheckEnabled: false })) },
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
			expect(defaults.jobsRepository.upsertJob).not.toHaveBeenCalled();
			expect(defaults.jobsRepository.upsertCleanupJob).not.toHaveBeenCalled();
		});

		it("marks degraded, warns, schedules the recovery job and returns degraded when every target is unreachable", async () => {
			const { service, defaults } = createService({ networkService: { requestStatus: statusFor([]) } });

			const result = await service.assessAfterFailure();

			expect(result).toBe("degraded");
			expect(defaults.egressStateRepository.markDegraded).toHaveBeenCalledWith(
				[expect.objectContaining({ target: "1.1.1.1", reachable: false }), expect.objectContaining({ target: "8.8.8.8", reachable: false })],
				expect.any(Date)
			);
			expect(defaults.egressStateRepository.recordProbe).not.toHaveBeenCalled();
			expect(defaults.logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("egress degraded") }));
			expect(defaults.jobsRepository.upsertCleanupJob).toHaveBeenCalledWith({
				id: "egress",
				type: "egress",
				refId: null,
				isActive: true,
				nextScheduledAt: expect.any(Number),
				intervalMs: 5_000,
			});
			expect(defaults.jobsRepository.upsertJob).not.toHaveBeenCalled();
			// Job first, transition second: a crash in between leaves a stray row, never an unpolled degraded state
			const scheduleOrder = (defaults.jobsRepository.upsertCleanupJob as jest.Mock).mock.invocationCallOrder[0]!;
			const transitionOrder = (defaults.egressStateRepository.markDegraded as jest.Mock).mock.invocationCallOrder[0]!;
			expect(scheduleOrder).toBeLessThan(transitionOrder);
		});

		it("still returns degraded and leaves the job scheduled when another worker performed the transition first", async () => {
			const { service, defaults } = createService({
				networkService: { requestStatus: statusFor([]) },
				egressStateRepository: degradedRepository({
					findSingleton: jest.fn().mockResolvedValue(makeState()),
					markDegraded: jest.fn().mockResolvedValue(null),
				}),
			});

			const result = await service.assessAfterFailure();

			expect(result).toBe("degraded");
			expect(defaults.jobsRepository.upsertCleanupJob).toHaveBeenCalledWith(expect.objectContaining({ id: "egress", intervalMs: 5_000 }));
			expect(defaults.logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("already recorded") }));
		});

		it("does not mark degraded when the recovery job cannot be scheduled", async () => {
			const { service, defaults } = createService({
				networkService: { requestStatus: statusFor([]) },
				jobsRepository: {
					upsertJob: jest.fn(),
					upsertCleanupJob: jest.fn().mockRejectedValue(new Error("db down")),
					deleteGlobalJobIfUnchanged: jest.fn(),
				},
			});

			expect(await service.assessAfterFailure()).toBeNull();
			expect(defaults.egressStateRepository.markDegraded).not.toHaveBeenCalled();
		});

		it("returns degraded without probing when the persisted state is already degraded, without touching the job's schedule", async () => {
			const { service, defaults } = createService({ egressStateRepository: degradedRepository() });

			const result = await service.assessAfterFailure();

			expect(result).toBe("degraded");
			expect(defaults.networkService.requestStatus).not.toHaveBeenCalled();
			expect(defaults.egressStateRepository.markDegraded).not.toHaveBeenCalled();
			expect(defaults.egressStateRepository.recordProbe).not.toHaveBeenCalled();
			expect(defaults.jobsRepository.upsertJob).toHaveBeenCalledWith(expect.objectContaining({ id: "egress", intervalMs: 5_000 }));
			expect(defaults.jobsRepository.upsertCleanupJob).not.toHaveBeenCalled();
		});

		it("falls back to the default targets when the configured list is empty", async () => {
			const { service, defaults } = createService({
				settingsService: { getCachedDBSettings: jest.fn().mockResolvedValue(makeSettings({ egressCheckTargets: [] })) },
			});

			await service.assessAfterFailure();

			expect(probedUrls(defaults)).toEqual(["1.1.1.1", "8.8.8.8"]);
		});

		it("returns null and logs when the assessment itself fails", async () => {
			const { service, defaults } = createService({
				settingsService: { getCachedDBSettings: jest.fn().mockRejectedValue(new Error("db down")) },
			});

			const result = await service.assessAfterFailure();

			expect(result).toBeNull();
			expect(defaults.logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: "db down", method: "assessAfterFailure" }));
		});
	});

	// ── shared assessment ─────────────────────────────────────────────────────

	describe("shared assessment", () => {
		it("shares one probe between concurrent failures", async () => {
			const { service, defaults } = createService({ networkService: { requestStatus: statusFor(["8.8.8.8"]) } });

			const results = await Promise.all([service.assessAfterFailure(), service.assessAfterFailure(), service.assessAfterFailure()]);

			expect(results).toEqual(["ok", "ok", "ok"]);
			expect(defaults.settingsService.getCachedDBSettings).toHaveBeenCalledTimes(1);
			expect(defaults.networkService.requestStatus).toHaveBeenCalledTimes(2); // one call per target, once
			expect(defaults.egressStateRepository.recordProbe).toHaveBeenCalledTimes(1);
		});

		it("keeps sharing an in-flight assessment that outlives the reuse window", async () => {
			jest.useFakeTimers();
			const { service, defaults } = createService({ networkService: { requestStatus: jest.fn().mockReturnValue(new Promise(() => {})) } });

			const first = service.assessAfterFailure();
			await jest.advanceTimersByTimeAsync(4_900); // probes still hanging, past the 5 s reuse window from the first call
			const second = service.assessAfterFailure();
			await jest.advanceTimersByTimeAsync(200); // probe timeout fires, both settle

			expect(await Promise.all([first, second])).toEqual(["degraded", "degraded"]);
			expect(defaults.networkService.requestStatus).toHaveBeenCalledTimes(2); // one round of two targets, not two rounds
		});

		it("reuses a settled assessment within the reuse window and probes again after it", async () => {
			jest.useFakeTimers();
			const { service, defaults } = createService({ networkService: { requestStatus: statusFor(["8.8.8.8"]) } });

			await service.assessAfterFailure();
			await jest.advanceTimersByTimeAsync(1_000);
			await service.assessAfterFailure();
			expect(defaults.egressStateRepository.recordProbe).toHaveBeenCalledTimes(1);

			await jest.advanceTimersByTimeAsync(5_000);
			await service.assessAfterFailure();
			expect(defaults.egressStateRepository.recordProbe).toHaveBeenCalledTimes(2);
		});

		it("reuses a disabled result instead of re-reading settings for every failure", async () => {
			const getCachedDBSettings = jest.fn().mockResolvedValue(makeSettings({ egressCheckEnabled: false }));
			const { service } = createService({ settingsService: { getCachedDBSettings } });

			expect(await service.assessAfterFailure()).toBeNull();
			expect(await service.assessAfterFailure()).toBeNull();

			expect(getCachedDBSettings).toHaveBeenCalledTimes(1);
		});

		it("does not cache an internal failure", async () => {
			const getCachedDBSettings = jest.fn().mockRejectedValueOnce(new Error("db down")).mockResolvedValue(makeSettings());
			const { service, defaults } = createService({ settingsService: { getCachedDBSettings } });

			expect(await service.assessAfterFailure()).toBeNull();
			expect(await service.assessAfterFailure()).toBe("ok");
			expect(defaults.egressStateRepository.recordProbe).toHaveBeenCalledTimes(1);
		});
	});

	// ── checkRecovery (the "egress" job) ──────────────────────────────────────

	describe("checkRecovery", () => {
		it("marks recovered, releases the job and logs when a target becomes reachable", async () => {
			const { service, defaults } = createService({
				egressStateRepository: degradedRepository(),
				networkService: { requestStatus: statusFor(["1.1.1.1"]) },
			});
			const job = makeJob({ nextScheduledAt: 123_456 });

			await service.checkRecovery(job);

			expect(defaults.egressStateRepository.markRecovered).toHaveBeenCalledWith(
				[expect.objectContaining({ target: "1.1.1.1", reachable: true }), expect.objectContaining({ target: "8.8.8.8", reachable: false })],
				expect.any(Date)
			);
			// Conditional on the schedule this run claimed, so a concurrent new episode keeps its job
			expect(defaults.jobsRepository.deleteGlobalJobIfUnchanged).toHaveBeenCalledWith("egress", 123_456);
			expect(defaults.logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("Instance egress recovered") }));
		});

		it("releases the job but does not log a recovery when another process already recorded it", async () => {
			const { service, defaults } = createService({
				egressStateRepository: degradedRepository({ markRecovered: jest.fn().mockResolvedValue(null) }),
				networkService: { requestStatus: statusFor(["1.1.1.1"]) },
			});

			await service.checkRecovery(makeJob());

			expect(defaults.jobsRepository.deleteGlobalJobIfUnchanged).toHaveBeenCalledWith("egress", 1_000);
			expect(defaults.logger.info).not.toHaveBeenCalledWith(
				expect.objectContaining({ message: expect.stringContaining("Instance egress recovered") })
			);
		});

		it("records the probe and keeps the job while every target stays unreachable", async () => {
			const { service, defaults } = createService({
				egressStateRepository: degradedRepository(),
				networkService: { requestStatus: statusFor([]) },
			});

			await service.checkRecovery(makeJob());

			expect(defaults.egressStateRepository.recordProbe).toHaveBeenCalledTimes(1);
			expect(defaults.egressStateRepository.markRecovered).not.toHaveBeenCalled();
			expect(defaults.jobsRepository.deleteGlobalJobIfUnchanged).not.toHaveBeenCalled();
		});

		it("releases the job without probing when the persisted state is no longer degraded", async () => {
			const { service, defaults } = createService();

			await service.checkRecovery(makeJob());

			expect(defaults.networkService.requestStatus).not.toHaveBeenCalled();
			expect(defaults.egressStateRepository.markRecovered).not.toHaveBeenCalled();
			expect(defaults.jobsRepository.deleteGlobalJobIfUnchanged).toHaveBeenCalledWith("egress", 1_000);
		});

		it("releases the job without probing when the feature has been disabled mid-episode", async () => {
			const { service, defaults } = createService({
				settingsService: { getCachedDBSettings: jest.fn().mockResolvedValue(makeSettings({ egressCheckEnabled: false })) },
				egressStateRepository: degradedRepository(),
			});

			await service.checkRecovery(makeJob());

			expect(defaults.networkService.requestStatus).not.toHaveBeenCalled();
			expect(defaults.jobsRepository.deleteGlobalJobIfUnchanged).toHaveBeenCalledWith("egress", 1_000);
		});

		it("lets errors propagate so the queue records the failure and retries", async () => {
			const { service } = createService({
				egressStateRepository: degradedRepository({ findSingleton: jest.fn().mockRejectedValue(new Error("db down")) }),
			});

			await expect(service.checkRecovery(makeJob())).rejects.toThrow("db down");
		});
	});
});
