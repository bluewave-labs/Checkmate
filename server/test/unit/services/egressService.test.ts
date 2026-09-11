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
		networkService: { requestStatus: statusFor(["1.1.1.1", "8.8.8.8"]) },
		notificationsService: { sendEgressRecoveredNotification: jest.fn().mockResolvedValue(true) },
		logger: createMockLogger(),
		...overrides,
	};
	const service = new EgressService(
		defaults.settingsService as any,
		defaults.egressStateRepository as any,
		defaults.networkService as any,
		defaults.notificationsService as any,
		defaults.logger as any
	);
	return { service, defaults };
};

// Lets the setTimeout chain in startRecoveryPolling settle (settings read, then timer armed) before advancing time.
const runOneTick = async (intervalMs: number) => {
	await jest.advanceTimersByTimeAsync(0);
	await jest.advanceTimersByTimeAsync(intervalMs);
};

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

		it("marks degraded, warns and returns degraded when every target is unreachable", async () => {
			jest.useFakeTimers();
			const { service, defaults } = createService({ networkService: { requestStatus: statusFor([]) } });

			const result = await service.assessAfterFailure();

			expect(result).toBe("degraded");
			expect(defaults.egressStateRepository.markDegraded).toHaveBeenCalledWith(
				[expect.objectContaining({ target: "1.1.1.1", reachable: false }), expect.objectContaining({ target: "8.8.8.8", reachable: false })],
				expect.any(Date)
			);
			expect(defaults.egressStateRepository.recordProbe).not.toHaveBeenCalled();
			expect(defaults.logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("egress degraded") }));
			expect(defaults.logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: "Starting egress recovery polling" }));
			service.stop();
		});

		it("returns degraded without probing when the persisted state is already degraded", async () => {
			jest.useFakeTimers();
			const { service, defaults } = createService({
				egressStateRepository: {
					findSingleton: jest.fn().mockResolvedValue(makeState({ status: "degraded" })),
					recordProbe: jest.fn(),
					markDegraded: jest.fn(),
					markRecovered: jest.fn(),
				},
			});

			const result = await service.assessAfterFailure();

			expect(result).toBe("degraded");
			expect(defaults.networkService.requestStatus).not.toHaveBeenCalled();
			expect(defaults.egressStateRepository.markDegraded).not.toHaveBeenCalled();
			expect(defaults.egressStateRepository.recordProbe).not.toHaveBeenCalled();
			service.stop();
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

	// ── recovery polling ──────────────────────────────────────────────────────

	describe("recovery polling", () => {
		it("marks recovered and sends the notification once when a target becomes reachable", async () => {
			jest.useFakeTimers();
			const recovered = makeState({ lastRecoveredAt: "2026-01-01T10:05:00.000Z", degradedSince: "2026-01-01T10:00:00.000Z" });
			const { service, defaults } = createService({
				egressStateRepository: {
					findSingleton: jest.fn().mockResolvedValue(makeState({ status: "degraded" })),
					recordProbe: jest.fn(),
					markDegraded: jest.fn(),
					markRecovered: jest.fn().mockResolvedValue(recovered),
				},
				networkService: { requestStatus: statusFor(["1.1.1.1"]) },
			});

			service.startRecoveryPolling();
			await runOneTick(30_000);

			expect(defaults.egressStateRepository.markRecovered).toHaveBeenCalledTimes(1);
			expect(defaults.notificationsService.sendEgressRecoveredNotification).toHaveBeenCalledTimes(1);
			expect(defaults.notificationsService.sendEgressRecoveredNotification).toHaveBeenCalledWith(recovered, ["notif-1"]);

			// Loop has stopped: a further interval produces no more work
			await runOneTick(30_000);
			expect(defaults.egressStateRepository.markRecovered).toHaveBeenCalledTimes(1);
			expect(defaults.notificationsService.sendEgressRecoveredNotification).toHaveBeenCalledTimes(1);
		});

		it("does not send a notification when another process already recorded the recovery", async () => {
			jest.useFakeTimers();
			const { service, defaults } = createService({
				egressStateRepository: {
					findSingleton: jest.fn().mockResolvedValue(makeState({ status: "degraded" })),
					recordProbe: jest.fn(),
					markDegraded: jest.fn(),
					markRecovered: jest.fn().mockResolvedValue(null),
				},
				networkService: { requestStatus: statusFor(["1.1.1.1"]) },
			});

			service.startRecoveryPolling();
			await runOneTick(30_000);

			expect(defaults.egressStateRepository.markRecovered).toHaveBeenCalledTimes(1);
			expect(defaults.notificationsService.sendEgressRecoveredNotification).not.toHaveBeenCalled();
		});

		it("records the probe and keeps polling while every target stays unreachable", async () => {
			jest.useFakeTimers();
			const { service, defaults } = createService({
				egressStateRepository: {
					findSingleton: jest.fn().mockResolvedValue(makeState({ status: "degraded" })),
					recordProbe: jest.fn().mockResolvedValue(makeState({ status: "degraded" })),
					markDegraded: jest.fn(),
					markRecovered: jest.fn(),
				},
				networkService: { requestStatus: statusFor([]) },
			});

			service.startRecoveryPolling();
			await runOneTick(30_000);
			await runOneTick(30_000);

			expect(defaults.egressStateRepository.recordProbe).toHaveBeenCalledTimes(2);
			expect(defaults.egressStateRepository.markRecovered).not.toHaveBeenCalled();
			service.stop();
		});

		it("stops polling when the persisted state is no longer degraded", async () => {
			jest.useFakeTimers();
			const { service, defaults } = createService({
				egressStateRepository: {
					findSingleton: jest.fn().mockResolvedValue(makeState({ status: "ok" })),
					recordProbe: jest.fn(),
					markDegraded: jest.fn(),
					markRecovered: jest.fn(),
				},
			});

			service.startRecoveryPolling();
			await runOneTick(30_000);

			expect(defaults.networkService.requestStatus).not.toHaveBeenCalled();
			await runOneTick(30_000);
			expect(defaults.egressStateRepository.findSingleton).toHaveBeenCalledTimes(1);
		});

		it("survives a failing tick and reschedules", async () => {
			jest.useFakeTimers();
			const findSingleton = jest
				.fn()
				.mockRejectedValueOnce(new Error("db blip"))
				.mockResolvedValue(makeState({ status: "degraded" }));
			const { service, defaults } = createService({
				egressStateRepository: {
					findSingleton,
					recordProbe: jest.fn().mockResolvedValue(makeState()),
					markDegraded: jest.fn(),
					markRecovered: jest.fn(),
				},
				networkService: { requestStatus: statusFor([]) },
			});

			service.startRecoveryPolling();
			await runOneTick(30_000);
			expect(defaults.logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: "db blip", method: "tick" }));

			await runOneTick(30_000);
			expect(defaults.egressStateRepository.recordProbe).toHaveBeenCalledTimes(1);
			service.stop();
		});

		it("re-reads the poll interval from settings on each tick", async () => {
			jest.useFakeTimers();
			const { service, defaults } = createService({
				settingsService: { getDBSettings: jest.fn().mockResolvedValue(makeSettings({ egressPollIntervalSeconds: 5 })) },
				egressStateRepository: {
					findSingleton: jest.fn().mockResolvedValue(makeState({ status: "degraded" })),
					recordProbe: jest.fn().mockResolvedValue(makeState({ status: "degraded" })),
					markDegraded: jest.fn(),
					markRecovered: jest.fn(),
				},
				networkService: { requestStatus: statusFor([]) },
			});

			service.startRecoveryPolling();
			await runOneTick(5_000);

			expect(defaults.egressStateRepository.recordProbe).toHaveBeenCalledTimes(1);
			service.stop();
		});

		it("is idempotent: a second start does not arm a second loop", async () => {
			jest.useFakeTimers();
			const { service, defaults } = createService({
				egressStateRepository: {
					findSingleton: jest.fn().mockResolvedValue(makeState({ status: "degraded" })),
					recordProbe: jest.fn().mockResolvedValue(makeState({ status: "degraded" })),
					markDegraded: jest.fn(),
					markRecovered: jest.fn(),
				},
				networkService: { requestStatus: statusFor([]) },
			});

			service.startRecoveryPolling();
			service.startRecoveryPolling();
			await runOneTick(30_000);

			expect(defaults.egressStateRepository.recordProbe).toHaveBeenCalledTimes(1);
			service.stop();
		});
	});

	// ── init ──────────────────────────────────────────────────────────────────

	describe("init", () => {
		it("resumes polling when the feature is enabled and the persisted state is degraded", async () => {
			jest.useFakeTimers();
			const { service, defaults } = createService({
				egressStateRepository: {
					findSingleton: jest.fn().mockResolvedValue(makeState({ status: "degraded" })),
					recordProbe: jest.fn(),
					markDegraded: jest.fn(),
					markRecovered: jest.fn().mockResolvedValue(makeState()),
				},
			});

			await service.init();

			expect(defaults.logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: "Starting egress recovery polling" }));
			service.stop();
		});

		it("does nothing when the persisted state is ok", async () => {
			const { service, defaults } = createService();

			await service.init();

			expect(defaults.logger.info).not.toHaveBeenCalled();
		});

		it("does nothing when the feature is disabled", async () => {
			const { service, defaults } = createService({
				settingsService: { getDBSettings: jest.fn().mockResolvedValue(makeSettings({ egressCheckEnabled: false })) },
			});

			await service.init();

			expect(defaults.egressStateRepository.findSingleton).not.toHaveBeenCalled();
		});
	});
});
