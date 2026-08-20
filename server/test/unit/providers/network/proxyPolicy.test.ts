import { describe, expect, it, afterEach } from "@jest/globals";
import {
	PROXYABLE_MONITOR_TYPES,
	ProxyAgentCache,
	parseProxyMonitorTypes,
	resolveProxyForCheck,
} from "../../../../src/service/network/ProxyPolicy.ts";

// proxy-from-env reads process.env directly, so these tests set and restore it.
const PROXY_KEYS = ["HTTP_PROXY", "HTTPS_PROXY", "NO_PROXY", "http_proxy", "https_proxy", "no_proxy"];

const withEnv = (vars: Record<string, string>) => {
	for (const key of PROXY_KEYS) delete process.env[key];
	for (const [key, value] of Object.entries(vars)) process.env[key] = value;
};

afterEach(() => {
	for (const key of PROXY_KEYS) delete process.env[key];
});

const defaults = () => parseProxyMonitorTypes(undefined).types;

describe("parseProxyMonitorTypes", () => {
	it("defaults to http and pagespeed, excluding infrastructure", () => {
		const { types, warning } = parseProxyMonitorTypes(undefined);

		expect([...types].sort()).toEqual([...PROXYABLE_MONITOR_TYPES].sort());
		expect(types.has("hardware")).toBe(false);
		expect(warning).toBeUndefined();
	});

	it("treats an empty value as unset", () => {
		expect([...parseProxyMonitorTypes("   ").types].sort()).toEqual([...PROXYABLE_MONITOR_TYPES].sort());
	});

	it("lets operators opt infrastructure in", () => {
		const { types, warning } = parseProxyMonitorTypes("http,hardware");

		expect(types.has("hardware")).toBe(true);
		expect(types.has("pagespeed")).toBe(false);
		expect(warning).toBeUndefined();
	});

	it("tolerates whitespace and mixed case", () => {
		const { types } = parseProxyMonitorTypes("  HTTP , Hardware  ");

		expect([...types].sort()).toEqual(["hardware", "http"]);
	});

	it("allows proxying to be disabled entirely with an explicit sentinel", () => {
		const { types, warning } = parseProxyMonitorTypes("none");

		expect(types.size).toBe(0);
		// "none" is a supported value, not a typo, so it must not warn.
		expect(warning).toBeUndefined();
	});

	it("honours the none sentinel wherever it appears", () => {
		expect(parseProxyMonitorTypes("none,http").types.size).toBe(0);
	});

	it("leaves an all-unproxyable list empty rather than proxying types nobody named", () => {
		// "ping,port" is a misunderstanding, but a deliberate one — silently
		// proxying http instead would route traffic the operator never nominated.
		const { types, warning } = parseProxyMonitorTypes("ping,port");

		expect(types.size).toBe(0);
		expect(warning).toContain("cannot be proxied");
	});

	it("falls back to defaults when every entry is invalid, rather than disabling proxying", () => {
		// Silently proxying nothing would take every HTTP monitor down in a
		// restricted-egress deployment, which is worse than ignoring the typo.
		const { types, warning } = parseProxyMonitorTypes("htpp");

		expect([...types].sort()).toEqual([...PROXYABLE_MONITOR_TYPES].sort());
		expect(warning).toContain("Falling back to");
	});

	it("treats the internal unknown type as a typo", () => {
		const { types, warning } = parseProxyMonitorTypes("unknown");

		expect([...types].sort()).toEqual([...PROXYABLE_MONITOR_TYPES].sort());
		expect(warning).toContain("unknown monitor type");
	});

	it("drops socket-based types that a proxy cannot carry, and says so", () => {
		const { types, warning } = parseProxyMonitorTypes("http,ping,port,dns");

		expect([...types]).toEqual(["http"]);
		expect(warning).toContain("cannot be proxied");
		expect(warning).toContain("ping");
	});

	it("reports unknown types rather than silently ignoring them", () => {
		const { types, warning } = parseProxyMonitorTypes("http,htpp");

		expect([...types]).toEqual(["http"]);
		expect(warning).toContain("unknown monitor type");
		expect(warning).toContain("htpp");
	});
});

describe("resolveProxyForCheck", () => {
	it("proxies a public HTTP monitor", () => {
		withEnv({ HTTPS_PROXY: "http://corp:3128" });

		expect(resolveProxyForCheck("http", "https://example.com", defaults()).proxyUrl).toBe("http://corp:3128");
	});

	it("leaves infrastructure checks direct by default", () => {
		withEnv({ HTTPS_PROXY: "http://corp:3128" });

		// Capture agents sit on the internal network; proxying them would break them.
		expect(resolveProxyForCheck("hardware", "https://10.0.0.5:59232", defaults()).proxyUrl).toBeNull();
	});

	it("proxies infrastructure once opted in", () => {
		withEnv({ HTTPS_PROXY: "http://corp:3128" });
		const types = parseProxyMonitorTypes("http,hardware").types;

		expect(resolveProxyForCheck("hardware", "https://10.0.0.5:59232", types).proxyUrl).toBe("http://corp:3128");
	});

	it("returns null when no proxy is configured", () => {
		withEnv({});

		expect(resolveProxyForCheck("http", "https://example.com", defaults()).proxyUrl).toBeNull();
	});

	it("honours NO_PROXY host entries", () => {
		withEnv({ HTTPS_PROXY: "http://corp:3128", NO_PROXY: "internal.example.com" });

		expect(resolveProxyForCheck("http", "https://internal.example.com", defaults()).proxyUrl).toBeNull();
		expect(resolveProxyForCheck("http", "https://public.example.com", defaults()).proxyUrl).toBe("http://corp:3128");
	});

	it("honours NO_PROXY wildcards", () => {
		withEnv({ HTTPS_PROXY: "http://corp:3128", NO_PROXY: "*.internal" });

		expect(resolveProxyForCheck("http", "https://box.internal", defaults()).proxyUrl).toBeNull();
	});

	it("keeps credentials in an authenticated proxy URL", () => {
		withEnv({ HTTPS_PROXY: "http://enki:s3cr3t@corp:3128" });

		expect(resolveProxyForCheck("http", "https://example.com", defaults()).proxyUrl).toBe("http://enki:s3cr3t@corp:3128");
	});

	it("selects the proxy matching the target scheme", () => {
		withEnv({ HTTP_PROXY: "http://plain:3128", HTTPS_PROXY: "http://secure:3129" });

		expect(resolveProxyForCheck("http", "http://example.com", defaults()).proxyUrl).toBe("http://plain:3128");
		expect(resolveProxyForCheck("http", "https://example.com", defaults()).proxyUrl).toBe("http://secure:3129");
	});

	it("never proxies socket-based monitor types", () => {
		withEnv({ HTTPS_PROXY: "http://corp:3128" });

		for (const type of ["ping", "port", "docker", "grpc", "websocket", "dns", "game"] as const) {
			expect(resolveProxyForCheck(type, "https://example.com", defaults()).proxyUrl).toBeNull();
		}
	});
});

describe("ProxyAgentCache", () => {
	it("reuses one agent per proxy so connections stay pooled", () => {
		const cache = new ProxyAgentCache();

		const first = cache.get("http://corp:3128", "https://example.com");
		const second = cache.get("http://corp:3128", "https://other.example.com");

		expect(second).toBe(first);
		expect(cache.size).toBe(1);
	});

	it("uses a CONNECT-based agent for https targets", () => {
		const cache = new ProxyAgentCache();

		const agent = cache.get("http://corp:3128", "https://example.com");

		expect(agent.constructor.name).toBe("HttpsProxyAgent");
	});

	it("uses an absolute-URI agent for plain http targets", () => {
		const cache = new ProxyAgentCache();

		// HttpsProxyAgent would issue CONNECT, which hardened proxies allow only
		// to 443, breaking every http:// monitor.
		const agent = cache.get("http://corp:3128", "http://example.com");

		expect(agent.constructor.name).toBe("HttpProxyAgent");
	});

	it("keeps http and https target agents separate", () => {
		const cache = new ProxyAgentCache();

		cache.get("http://corp:3128", "https://example.com");
		cache.get("http://corp:3128", "http://example.com");

		expect(cache.size).toBe(2);
	});

	it("keeps a separate agent per proxy URL", () => {
		const cache = new ProxyAgentCache();

		cache.get("http://a:3128", "https://example.com");
		cache.get("http://b:3128", "https://example.com");

		expect(cache.size).toBe(2);
	});

	it("falls back to a CONNECT agent for an unparseable target", () => {
		const cache = new ProxyAgentCache();

		expect(cache.get("http://corp:3128", "not-a-url").constructor.name).toBe("HttpsProxyAgent");
	});
});
