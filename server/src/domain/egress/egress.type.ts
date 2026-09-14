// Egress self-check: detects loss of the instance's own outbound connectivity so that
// a burst of simultaneous monitor failures is not reported as a burst of real outages.

export const EgressStatuses = ["ok", "degraded"] as const;
export type EgressStatus = (typeof EgressStatuses)[number];

// Sensible defaults for a fresh install. Bare hosts are ICMP-pinged, host:port is a TCP connect,
// http(s):// URLs are fetched. Any one target being reachable means egress is fine.
export const DEFAULT_EGRESS_TARGETS = ["1.1.1.1", "8.8.8.8"] as const;
export const DEFAULT_EGRESS_POLL_INTERVAL_SECONDS = 30;
export const MIN_EGRESS_POLL_INTERVAL_SECONDS = 5;
export const MAX_EGRESS_POLL_INTERVAL_SECONDS = 600;
export const MAX_EGRESS_TARGETS = 10;

// Instance-global singleton persisted in MongoDB so that every worker process and the API
// process share one view of the state (the queue worker may run separately from the API).
export interface EgressState {
	id: string;
	status: EgressStatus;
	degradedSince: string | null; // ISO timestamp of the current or most recent degraded entry
	lastRecoveredAt: string | null; // ISO timestamp of the most recent recovery
	lastProbeAt: string | null; // ISO timestamp of the most recent reliability probe
	lastProbeResults: EgressProbeResult[];
	createdAt: string;
	updatedAt: string;
}

export interface EgressProbeResult {
	target: string;
	reachable: boolean;
	responseTime: number; // ms
	message?: string;
}
