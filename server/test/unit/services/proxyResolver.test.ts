import { describe, expect, it, jest } from "@jest/globals";
import { ProxyResolver, buildProxyUrl } from "../../../src/service/network/ProxyResolver.ts";
import type { Monitor } from "../../../src/domain/monitors/monitor.type.ts";
import type { Proxy } from "../../../src/domain/proxies/proxy.type.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "m1",
		teamId: "team",
		type: "http",
		proxyMode: "inherit",
		...overrides,
	}) as Monitor;

const makeProxy = (overrides?: Partial<Proxy>): Proxy =>
	({
		id: "p1",
		teamId: "team",
		name: "corp",
		protocol: "http",
		host: "proxy.example.com",
		port: 8080,
		...overrides,
	}) as Proxy;

const createResolver = (overrides?: Record<string, any>) => {
	const defaults = {
		proxiesRepository: { findByIdOrNull: jest.fn<() => Promise<Proxy | null>>().mockResolvedValue(makeProxy()) },
		settingsService: { getDBSettings: jest.fn<() => Promise<any>>().mockResolvedValue({ globalProxyEnabled: true, globalProxyId: "p1" }) },
		logger: createMockLogger(),
		ttlMs: 60_000,
		...overrides,
	};
	const resolver = new ProxyResolver(defaults.proxiesRepository as any, defaults.settingsService as any, defaults.logger as any, defaults.ttlMs);
	return { resolver, defaults };
};

describe("ProxyResolver", () => {
	// ── gates ─────────────────────────────────────────────────────────────────

	it("returns undefined for non-http monitors without touching repo or settings", async () => {
		const { resolver, defaults } = createResolver();

		const result = await resolver.resolve(makeMonitor({ type: "port", proxyMode: "custom", proxyId: "p1" } as Partial<Monitor>));

		expect(result).toBeUndefined();
		expect(defaults.proxiesRepository.findByIdOrNull).not.toHaveBeenCalled();
		expect(defaults.settingsService.getDBSettings).not.toHaveBeenCalled();
	});

	it("returns undefined for proxyMode 'none' without calling settings", async () => {
		const { resolver, defaults } = createResolver();

		const result = await resolver.resolve(makeMonitor({ proxyMode: "none" }));

		expect(result).toBeUndefined();
		expect(defaults.settingsService.getDBSettings).not.toHaveBeenCalled();
	});

	// ── custom mode ───────────────────────────────────────────────────────────

	it("resolves a custom proxy with a team-scoped lookup", async () => {
		const { resolver, defaults } = createResolver();

		const result = await resolver.resolve(makeMonitor({ proxyMode: "custom", proxyId: "p1" }));

		expect(result).toBe("http://proxy.example.com:8080");
		expect(defaults.proxiesRepository.findByIdOrNull).toHaveBeenCalledWith("p1", "team");
	});

	it("returns undefined and warns when the custom proxy no longer exists", async () => {
		const { resolver, defaults } = createResolver({
			proxiesRepository: { findByIdOrNull: jest.fn<() => Promise<Proxy | null>>().mockResolvedValue(null) },
		});

		const result = await resolver.resolve(makeMonitor({ proxyMode: "custom", proxyId: "gone" }));

		expect(result).toBeUndefined();
		expect(defaults.logger.warn).toHaveBeenCalled();
	});

	it("returns undefined and warns when proxyMode is custom but proxyId is missing, without a repo call", async () => {
		const { resolver, defaults } = createResolver();

		const result = await resolver.resolve(makeMonitor({ proxyMode: "custom", proxyId: undefined }));

		expect(result).toBeUndefined();
		expect(defaults.logger.warn).toHaveBeenCalled();
		expect(defaults.proxiesRepository.findByIdOrNull).not.toHaveBeenCalled();
	});

	// ── inherit mode ──────────────────────────────────────────────────────────

	it("returns undefined when the global proxy is disabled, without a repo call", async () => {
		const { resolver, defaults } = createResolver({
			settingsService: { getDBSettings: jest.fn<() => Promise<any>>().mockResolvedValue({ globalProxyEnabled: false, globalProxyId: "p1" }) },
		});

		const result = await resolver.resolve(makeMonitor({ proxyMode: "inherit" }));

		expect(result).toBeUndefined();
		expect(defaults.proxiesRepository.findByIdOrNull).not.toHaveBeenCalled();
	});

	it("resolves the global proxy with an unscoped lookup when enabled", async () => {
		const { resolver, defaults } = createResolver();

		const result = await resolver.resolve(makeMonitor({ proxyMode: "inherit" }));

		expect(result).toBe("http://proxy.example.com:8080");
		expect(defaults.proxiesRepository.findByIdOrNull).toHaveBeenCalledWith("p1");
	});

	it("returns undefined when the global proxy is enabled but globalProxyId is null, without a repo call", async () => {
		const { resolver, defaults } = createResolver({
			settingsService: { getDBSettings: jest.fn<() => Promise<any>>().mockResolvedValue({ globalProxyEnabled: true, globalProxyId: null }) },
		});

		const result = await resolver.resolve(makeMonitor({ proxyMode: "inherit" }));

		expect(result).toBeUndefined();
		expect(defaults.proxiesRepository.findByIdOrNull).not.toHaveBeenCalled();
	});

	it("returns undefined and warns when the global proxy references a proxy that no longer exists", async () => {
		const { resolver, defaults } = createResolver({
			proxiesRepository: { findByIdOrNull: jest.fn<() => Promise<Proxy | null>>().mockResolvedValue(null) },
		});

		const result = await resolver.resolve(makeMonitor({ proxyMode: "inherit" }));

		expect(result).toBeUndefined();
		expect(defaults.logger.warn).toHaveBeenCalled();
	});

	it("treats an unknown proxyMode as inherit", async () => {
		const { resolver, defaults } = createResolver();

		const result = await resolver.resolve(makeMonitor({ proxyMode: "garbage" as Monitor["proxyMode"] }));

		expect(result).toBe("http://proxy.example.com:8080");
		expect(defaults.settingsService.getDBSettings).toHaveBeenCalled();
	});

	// ── never throws ──────────────────────────────────────────────────────────

	it("returns undefined and warns when the repository throws", async () => {
		const { resolver, defaults } = createResolver({
			proxiesRepository: { findByIdOrNull: jest.fn<() => Promise<Proxy | null>>().mockRejectedValue(new Error("db down")) },
		});

		const result = await resolver.resolve(makeMonitor({ proxyMode: "custom", proxyId: "p1" }));

		expect(result).toBeUndefined();
		expect(defaults.logger.warn).toHaveBeenCalled();
	});

	it("returns undefined and warns when the settings service throws", async () => {
		const { resolver, defaults } = createResolver({
			settingsService: { getDBSettings: jest.fn<() => Promise<any>>().mockRejectedValue(new Error("db down")) },
		});

		const result = await resolver.resolve(makeMonitor({ proxyMode: "inherit" }));

		expect(result).toBeUndefined();
		expect(defaults.logger.warn).toHaveBeenCalled();
	});

	// ── caching ───────────────────────────────────────────────────────────────

	it("serves a second resolve within the TTL from cache", async () => {
		const { resolver, defaults } = createResolver();

		await resolver.resolve(makeMonitor({ proxyMode: "inherit" }));
		await resolver.resolve(makeMonitor({ proxyMode: "inherit" }));

		expect(defaults.settingsService.getDBSettings).toHaveBeenCalledTimes(1);
		expect(defaults.proxiesRepository.findByIdOrNull).toHaveBeenCalledTimes(1);
	});

	it("refetches after the TTL expires", async () => {
		const { resolver, defaults } = createResolver({ ttlMs: 0 });

		await resolver.resolve(makeMonitor({ proxyMode: "inherit" }));
		await resolver.resolve(makeMonitor({ proxyMode: "inherit" }));

		expect(defaults.settingsService.getDBSettings).toHaveBeenCalledTimes(2);
		expect(defaults.proxiesRepository.findByIdOrNull).toHaveBeenCalledTimes(2);
	});

	it("negative-caches a dangling ref, costing one repo call per TTL window", async () => {
		const { resolver, defaults } = createResolver({
			proxiesRepository: { findByIdOrNull: jest.fn<() => Promise<Proxy | null>>().mockResolvedValue(null) },
		});

		await resolver.resolve(makeMonitor({ proxyMode: "custom", proxyId: "gone" }));
		await resolver.resolve(makeMonitor({ proxyMode: "custom", proxyId: "gone" }));

		expect(defaults.proxiesRepository.findByIdOrNull).toHaveBeenCalledTimes(1);
	});

	it("shares one in-flight fetch between concurrent resolves", async () => {
		const { resolver, defaults } = createResolver();

		await Promise.all([
			resolver.resolve(makeMonitor({ proxyMode: "inherit" })),
			resolver.resolve(makeMonitor({ proxyMode: "inherit" })),
			resolver.resolve(makeMonitor({ proxyMode: "inherit" })),
		]);

		expect(defaults.settingsService.getDBSettings).toHaveBeenCalledTimes(1);
		expect(defaults.proxiesRepository.findByIdOrNull).toHaveBeenCalledTimes(1);
	});

	it("does not cache a rejected fetch — the next resolve retries", async () => {
		const findByIdOrNull = jest.fn<() => Promise<Proxy | null>>().mockRejectedValueOnce(new Error("db down")).mockResolvedValueOnce(makeProxy());
		const { resolver } = createResolver({ proxiesRepository: { findByIdOrNull } });

		const first = await resolver.resolve(makeMonitor({ proxyMode: "custom", proxyId: "p1" }));
		const second = await resolver.resolve(makeMonitor({ proxyMode: "custom", proxyId: "p1" }));

		expect(first).toBeUndefined();
		expect(second).toBe("http://proxy.example.com:8080");
		expect(findByIdOrNull).toHaveBeenCalledTimes(2);
	});

	it("does not let a scoped miss poison the unscoped global lookup for the same proxy id", async () => {
		const findByIdOrNull = jest.fn<(proxyId: string, teamId?: string) => Promise<Proxy | null>>(async (_proxyId, teamId) =>
			teamId ? null : makeProxy()
		);
		const { resolver } = createResolver({ proxiesRepository: { findByIdOrNull } });

		const customResult = await resolver.resolve(makeMonitor({ proxyMode: "custom", proxyId: "p1" }));
		const inheritResult = await resolver.resolve(makeMonitor({ proxyMode: "inherit" }));

		expect(customResult).toBeUndefined();
		expect(inheritResult).toBe("http://proxy.example.com:8080");
		expect(findByIdOrNull).toHaveBeenCalledTimes(2);
	});
});

describe("buildProxyUrl", () => {
	it("builds a URL without credentials when there is no username", () => {
		expect(buildProxyUrl(makeProxy())).toBe("http://proxy.example.com:8080");
	});

	it("builds a URL with username and password", () => {
		expect(buildProxyUrl(makeProxy({ username: "user", password: "pass" }))).toBe("http://user:pass@proxy.example.com:8080");
	});

	it("percent-encodes credentials", () => {
		expect(buildProxyUrl(makeProxy({ username: "user@x", password: "p@ss" }))).toBe("http://user%40x:p%40ss@proxy.example.com:8080");
	});

	it("builds a URL with a username only, without a colon", () => {
		expect(buildProxyUrl(makeProxy({ username: "user" }))).toBe("http://user@proxy.example.com:8080");
	});

	it("emits no credentials for a password without a username", () => {
		expect(buildProxyUrl(makeProxy({ password: "pass" }))).toBe("http://proxy.example.com:8080");
	});

	it("uses the https scheme without a trailing slash", () => {
		expect(buildProxyUrl(makeProxy({ protocol: "https" }))).toBe("https://proxy.example.com:8080");
	});
});
