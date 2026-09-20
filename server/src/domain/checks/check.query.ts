import type { EgressStatus } from "@/domain/egress/egress.type.js";

// A check recorded while the instance's own egress was down says nothing about the target, so it is left out of
// every aggregate: uptime percentages, up/down counts and the response-time series alike. A degraded episode
// therefore reads as a gap in monitoring rather than as downtime or as a dip in response time.
// Spread this into the $match or filter of any query that reports statistics. Check listings keep degraded checks.
export const EXCLUDE_DEGRADED_EGRESS_MATCH = { egressStatus: { $ne: "degraded" satisfies EgressStatus } } as const;
