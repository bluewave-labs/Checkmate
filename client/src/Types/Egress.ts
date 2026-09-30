// Mirrors the egress self-check state returned by GET /egress.
export const EgressStatuses = ["ok", "degraded"] as const;
export type EgressStatus = (typeof EgressStatuses)[number];

export interface EgressProbeResult {
	target: string;
	reachable: boolean;
	responseTime: number;
	message?: string;
}

export interface EgressState {
	id: string;
	status: EgressStatus;
	degradedSince: string | null;
	lastRecoveredAt: string | null;
	lastProbeAt: string | null;
	lastProbeResults: EgressProbeResult[];
}
