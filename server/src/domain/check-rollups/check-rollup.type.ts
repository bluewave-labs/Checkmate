import type { z } from "zod";
import type { checkRollupSchema, checkRollupUptimeSchema } from "@/domain/check-rollups/check-rollup.schema.js";

export const ROLLUP_BUCKET_MINUTES = 15;

export type CheckRollupUptime = z.infer<typeof checkRollupUptimeSchema>;
export type CheckRollup = z.infer<typeof checkRollupSchema>;
