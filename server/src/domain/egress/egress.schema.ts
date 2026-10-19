import { z } from "zod";
import { EgressStatuses } from "@/domain/egress/egress.type.js";

export const egressProbeResultSchema = z.object({
	target: z.string(),
	reachable: z.boolean(),
	responseTime: z.number(), // ms
	message: z.string().optional(),
});

// Instance-global singleton persisted in MongoDB so that every worker process and the API
// process share one view of the state (the queue worker may run separately from the API).
export const egressStateSchema = z.object({
	id: z.string(),
	status: z.enum(EgressStatuses),
	degradedSince: z.string().nullable(), // ISO timestamp of the current or most recent degraded entry
	lastRecoveredAt: z.string().nullable(), // ISO timestamp of the most recent recovery
	lastProbeAt: z.string().nullable(), // ISO timestamp of the most recent reliability probe
	lastProbeResults: z.array(egressProbeResultSchema),
	createdAt: z.string(),
	updatedAt: z.string(),
});

// What GET /egress returns. Any signed-in role may read it for the banner, so it leaves out the probe
// results: those name the admin-configured targets and carry probe error text. `enabled` lets the client
// poll less often while the self-check is switched off.
export const egressSummarySchema = egressStateSchema
	.pick({ status: true, degradedSince: true })
	.extend({ enabled: z.boolean() })
	.meta({ id: "EgressSummary" });
