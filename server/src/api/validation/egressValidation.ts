import { EgressStatuses } from "@/domain/egress/egress.type.js";
import { z } from "zod";

//****************************************
// Egress Validations
//****************************************

export const egressProbeResultResponseSchema = z.object({
	target: z.string(),
	reachable: z.boolean(),
	responseTime: z.number(),
	message: z.string().optional(),
});

export const egressStateResponseSchema = z.object({
	id: z.string(),
	status: z.enum(EgressStatuses),
	degradedSince: z.string().nullable(),
	lastRecoveredAt: z.string().nullable(),
	lastProbeAt: z.string().nullable(),
	lastProbeResults: z.array(egressProbeResultResponseSchema),
	createdAt: z.string(),
	updatedAt: z.string(),
});
