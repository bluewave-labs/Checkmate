import type { z } from "zod";
import type { egressProbeResultSchema, egressSummarySchema } from "@/domain/egress/egress.schema.js";

// Egress self-check: detects loss of the instance's own outbound connectivity so that
// a burst of simultaneous monitor failures is not reported as a burst of real outages.

export const EgressStatuses = ["ok", "degraded"] as const;
export type EgressStatus = (typeof EgressStatuses)[number];

// Defaults used when no targets are configured. HTTPS by hostname, so a probe also exercises DNS and is not
// fooled by networks that drop ICMP. Any HTTP response counts as reachable; one reachable target means egress is fine.
export const DEFAULT_EGRESS_TARGETS = ["https://www.google.com/generate_204", "https://www.cloudflare.com/cdn-cgi/trace"] as const;
export const MAX_EGRESS_TARGETS = 10;

export const VERDICT_TTL_MS = 10_000;
export const BANNER_FRESHNESS_MS = 60_000;

export type EgressSummary = z.infer<typeof egressSummarySchema>;
export type EgressProbeResult = z.infer<typeof egressProbeResultSchema>;
