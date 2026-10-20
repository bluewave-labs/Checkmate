import type { z } from "zod";
import type { egressProbeResultSchema, egressStateSchema, egressSummarySchema } from "@/domain/egress/egress.schema.js";

// Egress self-check: detects loss of the instance's own outbound connectivity so that
// a burst of simultaneous monitor failures is not reported as a burst of real outages.

export const EgressStatuses = ["ok", "degraded"] as const;
export type EgressStatus = (typeof EgressStatuses)[number];

// Sensible defaults for a fresh install. Bare hosts are ICMP-pinged, host:port is a TCP connect,
// http(s):// URLs are fetched. Any one target being reachable means egress is fine.
export const DEFAULT_EGRESS_TARGETS = ["1.1.1.1", "8.8.8.8"] as const;
export const MAX_EGRESS_TARGETS = 10;

export const VERDICT_TTL_MS = 10_000;
export const BANNER_FRESHNESS_MS = 60_000;

export type EgressState = z.infer<typeof egressStateSchema>;
export type EgressSummary = z.infer<typeof egressSummarySchema>;
export type EgressProbeResult = z.infer<typeof egressProbeResultSchema>;
