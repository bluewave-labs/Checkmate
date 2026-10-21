import { z } from "zod";
import { EgressStatuses } from "@/domain/egress/egress.type.js";

export const egressProbeResultSchema = z.object({
	target: z.string(),
	reachable: z.boolean(),
	responseTime: z.number(), // ms
	message: z.string().optional(),
});

// What GET /egress returns
export const egressSummarySchema = z
	.object({
		enabled: z.boolean(),
		status: z.enum(EgressStatuses),
		degradedSince: z.string().nullable(), // ISO timestamp of the earliest live degraded spell
		degradedWorkers: z.number(),
		totalWorkers: z.number(),
	})
	.meta({ id: "EgressSummary" });
