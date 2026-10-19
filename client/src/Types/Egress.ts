// Mirrors the egress self-check summary returned by GET /egress.
export const EgressStatuses = ["ok", "degraded"] as const;
export type EgressStatus = (typeof EgressStatuses)[number];

export interface EgressSummary {
	enabled: boolean;
	status: EgressStatus;
	degradedSince: string | null;
}
