import { EgressStatuses } from "@/domain/egress/egress.type.js";
import { z } from "zod";

//****************************************
// Egress Validations
//****************************************

export const egressSummaryResponseSchema = z.object({
	enabled: z.boolean(),
	status: z.enum(EgressStatuses),
	degradedSince: z.string().nullable(),
});
