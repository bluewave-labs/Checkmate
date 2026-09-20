// Egress self-check: detects loss of the instance's own outbound connectivity so that
// a burst of simultaneous monitor failures is not reported as a burst of real outages.

export const EgressStatuses = ["ok", "degraded"] as const;
export type EgressStatus = (typeof EgressStatuses)[number];
// Outcome of one assessment: a status, or "disabled" when the feature is switched off (distinct from an internal failure).
export type EgressAssessment = EgressStatus | "disabled";

// Sensible defaults for a fresh install. Bare hosts are ICMP-pinged, host:port is a TCP connect,
// http(s):// URLs are fetched. Any one target being reachable means egress is fine.
export const DEFAULT_EGRESS_TARGETS = ["1.1.1.1", "8.8.8.8"] as const;
export const MAX_EGRESS_TARGETS = 10;

// While the instance is marked degraded, every failing check is flagged from stored state without probing, so
// this interval is the window in which a recovered instance still discards its checks. It is deliberately fixed
// and not configurable: the only effect of raising it is a longer blind window.
export const EGRESS_RECOVERY_POLL_SECONDS = 5;

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
