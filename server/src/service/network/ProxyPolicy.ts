import { HttpProxyAgent } from "http-proxy-agent";
import { HttpsProxyAgent } from "https-proxy-agent";
import { getProxyForUrl } from "proxy-from-env";
import type { Agent as HttpAgent } from "http";
import type { Agent as HttpsAgent } from "https";
import { MonitorTypes, type MonitorType } from "@/domain/monitors/monitor.type.js";

/**
 * Monitor types whose checks may be routed through an outbound HTTP proxy.
 *
 * Only types served by HttpProvider can be proxied at all — ping, port, docker,
 * grpc, websocket, dns and game open raw sockets, which an HTTP proxy cannot
 * carry.
 *
 * "hardware" is deliberately excluded by default: infrastructure monitors talk
 * to Capture agents, which almost always sit on the internal network. Sending
 * those through a corporate proxy fails or hairpins, so operators must opt in
 * explicitly via PROXY_MONITOR_TYPES.
 */
export const PROXYABLE_MONITOR_TYPES = ["http", "pagespeed"] as const;
export type ProxyableMonitorType = (typeof PROXYABLE_MONITOR_TYPES)[number];

/** Types that reach the network through HttpProvider, and so could be proxied. */
const HTTP_BACKED_MONITOR_TYPES = ["http", "pagespeed", "hardware"] as const;

export interface ProxyResolution {
	/** Proxy URL to dial through, or null to connect directly. */
	proxyUrl: string | null;
}

/**
 * Parses the PROXY_MONITOR_TYPES escape hatch.
 *
 * Unset falls back to PROXYABLE_MONITOR_TYPES, and the literal "none" disables
 * proxying entirely. Entries that are not real monitor types, or that never
 * reach the network through HttpProvider, are dropped and reported so a typo
 * cannot silently disable proxying.
 */
export const parseProxyMonitorTypes = (raw: string | undefined): { types: Set<string>; warning?: string } => {
	if (raw === undefined || raw.trim() === "") {
		return { types: new Set<string>(PROXYABLE_MONITOR_TYPES) };
	}

	const requested = raw
		.split(",")
		.map((entry) => entry.trim().toLowerCase())
		.filter((entry) => entry !== "");

	// Explicit opt-out, so proxying can be disabled without unsetting the proxy
	// environment variables the rest of the container may rely on. Honoured
	// wherever it appears, so "none,http" disables rather than half-enabling.
	if (requested.includes("none")) {
		return { types: new Set<string>() };
	}

	const types = new Set<string>();
	const unknown: string[] = [];
	const unproxyable: string[] = [];

	for (const entry of requested) {
		// "unknown" is a real MonitorType but never a deliberate choice here.
		if (entry === "unknown" || !(MonitorTypes as readonly string[]).includes(entry)) {
			unknown.push(entry);
		} else if (!(HTTP_BACKED_MONITOR_TYPES as readonly string[]).includes(entry)) {
			unproxyable.push(entry);
		} else {
			types.add(entry);
		}
	}

	const problems: string[] = [];
	if (unknown.length > 0) {
		problems.push(`unknown monitor type(s): ${unknown.join(", ")}`);
	}
	if (unproxyable.length > 0) {
		problems.push(`monitor type(s) that do not use HTTP and cannot be proxied: ${unproxyable.join(", ")}`);
	}

	// Every entry was a typo. Disabling all proxying here would take every HTTP
	// monitor down in a restricted-egress deployment, so fall back to the defaults
	// and make the misconfiguration loud instead.
	//
	// An all-unproxyable list (e.g. "ping,port") is left empty on purpose: those
	// are deliberate choices, and silently proxying http instead would route
	// traffic the operator never nominated.
	if (types.size === 0 && unproxyable.length === 0) {
		return {
			types: new Set<string>(PROXYABLE_MONITOR_TYPES),
			warning: `PROXY_MONITOR_TYPES matched no proxyable monitor type — ${problems.join("; ")}. Falling back to: ${PROXYABLE_MONITOR_TYPES.join(", ")}. Use "none" to disable proxying.`,
		};
	}

	return {
		types,
		warning: problems.length > 0 ? `PROXY_MONITOR_TYPES ignored ${problems.join("; ")}. Proxying: ${[...types].join(", ")}` : undefined,
	};
};

/**
 * Decides whether a single check should be proxied.
 *
 * Honours NO_PROXY (including wildcards and port-qualified hosts) by delegating
 * to proxy-from-env, so the same rules operators already use for curl apply
 * here rather than a hand-rolled reimplementation.
 *
 * proxy-from-env resolves against process.env, which is read once at startup
 * (see createProxySettings). Checks run concurrently, so the environment is
 * never mutated per-check.
 */
export const resolveProxyForCheck = (monitorType: MonitorType, url: string, proxyableTypes: Set<string>): ProxyResolution => {
	if (!proxyableTypes.has(monitorType)) {
		return { proxyUrl: null };
	}

	const proxyUrl = getProxyForUrl(url);
	return { proxyUrl: proxyUrl === "" ? null : proxyUrl };
};

/**
 * Builds proxy agents on demand and reuses them.
 *
 * The agent must match the *target* scheme, not the proxy's. HttpsProxyAgent
 * always issues CONNECT, which hardened proxies (Squid's stock ACL among them)
 * permit only to 443 — so a plain-http target needs HttpProxyAgent, which sends
 * an absolute-URI request instead.
 *
 * Caching preserves connection pooling: without it every check would open a
 * fresh connection to the proxy. Node keys its own socket pools on the TLS
 * options it receives per request, so agents are shared across monitors
 * regardless of ignoreTlsErrors — that setting is applied per request in
 * HttpProvider, not baked into the agent.
 */
export class ProxyAgentCache {
	private readonly agents = new Map<string, HttpAgent | HttpsAgent>();

	get(proxyUrl: string, targetUrl: string): HttpAgent | HttpsAgent {
		const targetIsSecure = safeProtocol(targetUrl) !== "http:";
		const key = `${proxyUrl}::${targetIsSecure ? "https" : "http"}`;
		const existing = this.agents.get(key);
		if (existing) return existing;

		const options = { keepAlive: true, maxSockets: 256, maxFreeSockets: 256 };
		const agent = (targetIsSecure ? new HttpsProxyAgent(proxyUrl, options) : new HttpProxyAgent(proxyUrl, options)) as unknown as HttpsAgent;

		this.agents.set(key, agent);
		return agent;
	}

	/** Number of distinct agents held; used in tests to prove pooling. */
	get size(): number {
		return this.agents.size;
	}
}

/** Target URLs are validated upstream; fall back to https on anything odd. */
const safeProtocol = (url: string): string => {
	try {
		return new URL(url).protocol;
	} catch {
		return "https:";
	}
};
