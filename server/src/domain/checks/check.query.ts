import type { EgressStatus } from "@/domain/egress/egress.type.js";

// Checks recorded while the instance's own egress was down cannot be attributed to the target, so they
// are left out of every uptime percentage and up/down count. Response-time series keep them.
// Spread this into the $match / filter of a query, or use the expression form inside a $group accumulator.
export const EXCLUDE_DEGRADED_EGRESS_MATCH = { egressStatus: { $ne: "degraded" satisfies EgressStatus } } as const;

export const IS_NOT_DEGRADED_EGRESS_EXPR = { $ne: ["$egressStatus", "degraded" satisfies EgressStatus] } as const;
