import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { EgressService } from "../../../src/domain/egress/egress.service.ts";
import { DEFAULT_EGRESS_TARGETS, VERDICT_TTL_MS } from "../../../src/domain/egress/egress.type.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const WORKER_ID = "worker-1";

const makeSettings = (overrides?: Record<string, unknown>) => ({
	egressCheckEnabled: true,
	egressCheckTargets: ["1.1.1.1", "8.8.8.8"],
	...overrides,
});

// probe mock that answers per target url
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

// probe mock whose reachability can be switched between calls
const switchableProbe = (initiallyReachable: boolean) => {
	let reachable = initiallyReachable;
	const probe = jest.fn().mockImplementation(async (monitor: any) => ({
		monitorId: monitor.id,
		teamId: monitor.teamId,
		type: monitor.type,
		status: reachable,
		code: reachable ? 200 : 5000,
		message: reachable ? "Success" : "Ping failed",
		responseTime: 12,
	}));
	return { probe, setReachable: (value: boolean) => (reachable = value) };
};

const createService = (overrides?: Record<string, any>) => {
	const defaults = {
		settingsService: { getCachedDBSettings: jest.fn().mockResolvedValue(makeSettings()) },
		queueWorkersRepository: { setEgress: jest.fn().mockResolvedValue(undefined) },
		providerRegistry: { probe: statusFor(["1.1.1.1", "8.8.8.8"]) },
		proxyResolver: { resolve: jest.fn().mockResolvedValue(undefined) },
		logger: createMockLogger(),
		...overrides,
	};
	const service = new EgressService(
		defaults.settingsService as any,
		WORKER_ID,
		defaults.queueWorkersRepository as any,
		defaults.providerRegistry as any,
		defaults.proxyResolver as any,
		defaults.logger as any
	);
	return { service, defaults };
};

const probedUrls = (defaults: { providerRegistry: { probe: unknown } }) =>
	(defaults.providerRegistry.probe as jest.Mock).mock.calls.map((call) => (call[0] as any).url);

const publishedVerdicts = (defaults: { queueWorkersRepository: { setEgress: unknown } }) =>
	(defaults.queueWorkersRepository.setEgress as jest.Mock).mock.calls.map((call) => call[1] as any);

const DEGRADED_LOG = "Egress degraded on this worker: egress targets unreachable";
const RECOVERED_LOG = "Egress recovered for this worker";

// ── Tests ────────────────────────────────────────────────────────────────────

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

			const monitors = (defaults.providerRegistry.probe as jest.Mock).mock.calls.map((call) => call[0] as any);
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
			expect(defaults.providerRegistry.probe).toHaveBeenCalledWith(expect.objectContaining({ type: "http" }), {
				proxyUrl: "http://proxy.internal:3128",
			});
		});

		it("reports reachable only when the provider says status is true", async () => {
			const { service } = createService({ providerRegistry: { probe: statusFor(["1.1.1.1"]) } });

			const results = await service.probeTargets(["1.1.1.1", "8.8.8.8"]);

			expect(results).toEqual([
				expect.objectContaining({ target: "1.1.1.1", reachable: true, responseTime: 12 }),
				expect.objectContaining({ target: "8.8.8.8", reachable: false }),
			]);
		});

		it("treats any HTTP response, even 4xx/5xx, as reachable but a transport failure as unreachable", async () => {
			const probe = jest.fn().mockImplementation(async (monitor: any) => ({
				monitorId: monitor.id,
				teamId: monitor.teamId,
				type: monitor.type,
				status: false,
				code: monitor.url.includes("maintenance") ? 503 : 5000, // 5000 is HttpProvider's NETWORK_ERROR
				message: monitor.url.includes("maintenance") ? "Service Unavailable" : "ECONNREFUSED",
				responseTime: 3,
			}));
			const { service } = createService({ providerRegistry: { probe } });

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
			expect(defaults.providerRegistry.probe).not.toHaveBeenCalled();
		});

		it("counts a thrown provider error as unreachable", async () => {
			const { service } = createService({ providerRegistry: { probe: jest.fn().mockRejectedValue(new Error("ENETUNREACH")) } });

			const results = await service.probeTargets(["1.1.1.1"]);

			expect(results).toEqual([expect.objectContaining({ target: "1.1.1.1", reachable: false, message: "ENETUNREACH" })]);
		});

		it("counts a hung provider as unreachable once the probe timeout elapses", async () => {
			jest.useFakeTimers();
			const { service } = createService({ providerRegistry: { probe: jest.fn().mockReturnValue(new Promise(() => {})) } });

			const pending = service.probeTargets(["1.1.1.1"]);
			await jest.advanceTimersByTimeAsync(5000);
			const results = await pending;

			expect(results).toEqual([expect.objectContaining({ target: "1.1.1.1", reachable: false, message: expect.stringContaining("timed out") })]);
		});
	});

	// ── assessAfterFailure ────────────────────────────────────────────────────

	describe("assessAfterFailure", () => {
		it("returns null and does not probe or publish when the feature is disabled", async () => {
			const { service, defaults } = createService({
				settingsService: { getCachedDBSettings: jest.fn().mockResolvedValue(makeSettings({ egressCheckEnabled: false })) },
			});

			const result = await service.assessAfterFailure();

			expect(result).toBeNull();
			expect(defaults.providerRegistry.probe).not.toHaveBeenCalled();
			expect(defaults.queueWorkersRepository.setEgress).not.toHaveBeenCalled();
		});

		it("returns ok when any target is reachable", async () => {
			const { service } = createService({ providerRegistry: { probe: statusFor(["8.8.8.8"]) } });

			expect(await service.assessAfterFailure()).toBe("ok");
		});

		it("returns degraded when every target is unreachable", async () => {
			const { service } = createService({ providerRegistry: { probe: statusFor([]) } });

			expect(await service.assessAfterFailure()).toBe("degraded");
		});

		it("falls back to the default targets when the configured list is empty", async () => {
			const { service, defaults } = createService({
				settingsService: { getCachedDBSettings: jest.fn().mockResolvedValue(makeSettings({ egressCheckTargets: [] })) },
			});

			await service.assessAfterFailure();

			expect(probedUrls(defaults)).toEqual([...DEFAULT_EGRESS_TARGETS]);
		});

		it("returns null and logs when reading the settings fails", async () => {
			const { service, defaults } = createService({
				settingsService: { getCachedDBSettings: jest.fn().mockRejectedValue(new Error("db down")) },
			});

			const result = await service.assessAfterFailure();

			expect(result).toBeNull();
			expect(defaults.logger.error).toHaveBeenCalledWith({ err: new Error("db down") }, "Egress assessment failed");
		});
	});

	// ── shared verdict ────────────────────────────────────────────────────────

	describe("shared verdict", () => {
		it("shares one probe between concurrent failures", async () => {
			const { service, defaults } = createService({ providerRegistry: { probe: statusFor(["8.8.8.8"]) } });

			const results = await Promise.all([service.assessAfterFailure(), service.assessAfterFailure(), service.assessAfterFailure()]);

			expect(results).toEqual(["ok", "ok", "ok"]);
			expect(defaults.providerRegistry.probe).toHaveBeenCalledTimes(2); // one call per target, once
			expect(defaults.queueWorkersRepository.setEgress).toHaveBeenCalledTimes(1);
		});

		it("keeps sharing an in-flight verdict that outlives VERDICT_TTL_MS", async () => {
			jest.useFakeTimers();
			let releaseProxy: (value: undefined) => void = () => {};
			const resolve = jest.fn().mockReturnValue(new Promise<undefined>((done) => (releaseProxy = done)));
			const { service, defaults } = createService({ proxyResolver: { resolve }, providerRegistry: { probe: statusFor([]) } });

			const first = service.assessAfterFailure();
			await jest.advanceTimersByTimeAsync(VERDICT_TTL_MS + 1_000);
			const second = service.assessAfterFailure();
			releaseProxy(undefined);

			expect(await Promise.all([first, second])).toEqual(["degraded", "degraded"]);
			expect(resolve).toHaveBeenCalledTimes(2); // one round of two targets, not two rounds
			expect(defaults.queueWorkersRepository.setEgress).toHaveBeenCalledTimes(1);
		});

		it("reuses a settled verdict within VERDICT_TTL_MS and probes again after it", async () => {
			jest.useFakeTimers();
			const { service, defaults } = createService({ providerRegistry: { probe: statusFor(["8.8.8.8"]) } });

			await service.assessAfterFailure();
			await jest.advanceTimersByTimeAsync(VERDICT_TTL_MS - 1_000);
			await service.assessAfterFailure();
			expect(defaults.providerRegistry.probe).toHaveBeenCalledTimes(2);

			await jest.advanceTimersByTimeAsync(2_000);
			await service.assessAfterFailure();
			expect(defaults.providerRegistry.probe).toHaveBeenCalledTimes(4);
		});

		it("probes again within VERDICT_TTL_MS when the target list changes", async () => {
			const getCachedDBSettings = jest
				.fn()
				.mockResolvedValueOnce(makeSettings({ egressCheckTargets: ["1.1.1.1"] }))
				.mockResolvedValue(makeSettings({ egressCheckTargets: ["8.8.8.8"] }));
			const { service, defaults } = createService({ settingsService: { getCachedDBSettings } });

			await service.assessAfterFailure();
			await service.assessAfterFailure();

			expect(probedUrls(defaults)).toEqual(["1.1.1.1", "8.8.8.8"]);
		});

		it("returns null for an internal failure and does not cache it", async () => {
			const { service, defaults } = createService();
			const probeTargets = jest.spyOn(service, "probeTargets").mockRejectedValueOnce(new Error("boom"));

			expect(await service.assessAfterFailure()).toBeNull();
			expect(defaults.logger.error).toHaveBeenCalledWith({ err: new Error("boom") }, "Egress assessment failed");
			expect(await service.assessAfterFailure()).toBe("ok");
			expect(probeTargets).toHaveBeenCalledTimes(2);
		});

		it("probes again once a degraded verdict expires instead of assuming it still holds", async () => {
			jest.useFakeTimers();
			const { probe, setReachable } = switchableProbe(false);
			const { service } = createService({ providerRegistry: { probe } });

			expect(await service.assessAfterFailure()).toBe("degraded");
			setReachable(true);
			await jest.advanceTimersByTimeAsync(VERDICT_TTL_MS + 1);

			expect(await service.assessAfterFailure()).toBe("ok");
			expect(probe).toHaveBeenCalledTimes(4);
		});
	});

	// ── verdict tracking and publishing ───────────────────────────────────────

	describe("verdict tracking", () => {
		it("warns once at the start of a spell and logs info once when it ends", async () => {
			jest.useFakeTimers();
			const { probe, setReachable } = switchableProbe(false);
			const { service, defaults } = createService({ providerRegistry: { probe } });

			await service.assessAfterFailure();
			await jest.advanceTimersByTimeAsync(VERDICT_TTL_MS + 1);
			await service.assessAfterFailure();

			expect(defaults.logger.warn).toHaveBeenCalledTimes(1);
			expect(defaults.logger.warn).toHaveBeenCalledWith(expect.objectContaining({ results: expect.any(Array) }), DEGRADED_LOG);

			setReachable(true);
			await jest.advanceTimersByTimeAsync(VERDICT_TTL_MS + 1);
			await service.assessAfterFailure();
			await jest.advanceTimersByTimeAsync(VERDICT_TTL_MS + 1);
			await service.assessAfterFailure();

			const recoveredLogs = (defaults.logger.info as jest.Mock).mock.calls.filter((call) => call[1] === RECOVERED_LOG);
			expect(recoveredLogs).toHaveLength(1);
			expect(recoveredLogs[0]![0]).toEqual(expect.objectContaining({ degradedSince: expect.any(Date), results: expect.any(Array) }));
		});

		it("publishes each verdict for this worker, keeping degradedSince fixed across a spell", async () => {
			jest.useFakeTimers();
			jest.setSystemTime(1_000_000);
			const { probe, setReachable } = switchableProbe(false);
			const { service, defaults } = createService({ providerRegistry: { probe } });

			await service.assessAfterFailure();
			await jest.advanceTimersByTimeAsync(VERDICT_TTL_MS + 1);
			await service.assessAfterFailure();
			setReachable(true);
			await jest.advanceTimersByTimeAsync(VERDICT_TTL_MS + 1);
			await service.assessAfterFailure();

			const setEgress = defaults.queueWorkersRepository.setEgress as jest.Mock;
			expect(setEgress.mock.calls.every((call) => call[0] === WORKER_ID)).toBe(true);

			const [first, second, third] = publishedVerdicts(defaults);
			expect(first).toEqual({
				status: "degraded",
				checkedAt: expect.any(Number),
				degradedSince: first.checkedAt,
				lastProbeResults: [
					expect.objectContaining({ target: "1.1.1.1", reachable: false }),
					expect.objectContaining({ target: "8.8.8.8", reachable: false }),
				],
			});
			expect(second.status).toBe("degraded");
			expect(second.checkedAt).toBeGreaterThan(first.checkedAt);
			expect(second.degradedSince).toBe(first.degradedSince);
			expect(third).toEqual(expect.objectContaining({ status: "ok", degradedSince: null }));
		});

		it("logs a failed publish and still returns the verdict", async () => {
			const setEgress = jest.fn().mockRejectedValue(new Error("db down"));
			const { service, defaults } = createService({ queueWorkersRepository: { setEgress } });

			expect(await service.assessAfterFailure()).toBe("ok");
			await new Promise((done) => setImmediate(done));

			expect(defaults.logger.warn).toHaveBeenCalledWith({ err: new Error("db down") }, "Could not publish this worker's egress verdict");
		});
	});

	// ── shouldClearStatusWindow ───────────────────────────────────────────────

	describe("shouldClearStatusWindow", () => {
		it("returns false while egress is ok", async () => {
			const { service } = createService();

			expect(service.shouldClearStatusWindow("monitor-1")).toBe(false);
			await service.assessAfterFailure();
			expect(service.shouldClearStatusWindow("monitor-1")).toBe(false);
		});

		it("returns true once per monitor per spell", async () => {
			const { service } = createService({ providerRegistry: { probe: statusFor([]) } });

			await service.assessAfterFailure();

			expect(service.shouldClearStatusWindow("monitor-1")).toBe(true);
			expect(service.shouldClearStatusWindow("monitor-1")).toBe(false);
			expect(service.shouldClearStatusWindow("monitor-2")).toBe(true);
		});

		it("returns true again after recovery and a new spell", async () => {
			jest.useFakeTimers();
			const { probe, setReachable } = switchableProbe(false);
			const { service } = createService({ providerRegistry: { probe } });

			await service.assessAfterFailure();
			expect(service.shouldClearStatusWindow("monitor-1")).toBe(true);

			setReachable(true);
			await jest.advanceTimersByTimeAsync(VERDICT_TTL_MS + 1);
			await service.assessAfterFailure();
			expect(service.shouldClearStatusWindow("monitor-1")).toBe(false);

			setReachable(false);
			await jest.advanceTimersByTimeAsync(VERDICT_TTL_MS + 1);
			await service.assessAfterFailure();
			expect(service.shouldClearStatusWindow("monitor-1")).toBe(true);
		});
	});
});
