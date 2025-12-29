import { z } from "zod";
import { PlanKeys } from "@/types/entitlements.js";

export const subscribePlanSchema = z.object({
  planKey: z.enum(PlanKeys).optional(),
});

