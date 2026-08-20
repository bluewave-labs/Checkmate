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
	/** Set when the configured type list contained unusable entries. */
	warning?: string;
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
	// environment variables the rest of the container may rely on.
	if (requested.length === 1 && requested[0] === "none") {
		return { types: new Set<string>() };
	}

	const types = new Set<string>();
	const unknown: string[] = [];
	const unproxyable: string[] = [];

	for (const entry of requested) {
		if (!(MonitorTypes as readonly string[]).includes(entry)) {
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

	return {
		types,
		warning: problems.length > 0 ? `PROXY_MONITOR_TYPES ignored ${problems.join("; ")}. Proxying: ${[...types].join(", ") || "(none)"}` : undefined,
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
 * Keyed by proxy URL *and* TLS mode: a monitor with ignoreTlsErrors must not
 * share an agent with a strict one, or the relaxed setting would leak across
 * monitors. Caching also preserves connection pooling — without it every check
 * would open a fresh tunnel to the proxy.
 */
export class ProxyAgentCache {
	private readonly agents = new Map<string, HttpAgent | HttpsAgent>();

	get(proxyUrl: string, rejectUnauthorized: boolean): HttpAgent | HttpsAgent {
		const key = `${proxyUrl}::${rejectUnauthorized ? "strict" : "insecure"}`;
		const existing = this.agents.get(key);
		if (existing) return existing;

		const agent = new HttpsProxyAgent(proxyUrl, {
			keepAlive: true,
			maxSockets: 256,
			maxFreeSockets: 256,
			rejectUnauthorized,
		}) as unknown as HttpsAgent;

		this.agents.set(key, agent);
		return agent;
	}

	/** Number of distinct agents held; used in tests to prove pooling. */
	get size(): number {
		return this.agents.size;
	}
}
