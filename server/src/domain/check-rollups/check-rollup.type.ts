import type { z } from "zod";
import type {
	checkRollupHardwareSchema,
	checkRollupSchema,
	checkRollupSumCountSchema,
	checkRollupUptimeSchema,
} from "@/domain/check-rollups/check-rollup.schema.js";
export const ROLLUP_BUCKET_MINUTES = 15;
export const ROLLUP_BUCKET_MS = ROLLUP_BUCKET_MINUTES * 60 * 1000;
export const floorToRollupBucket = (ms: number): number => Math.floor(ms / ROLLUP_BUCKET_MS) * ROLLUP_BUCKET_MS;

export const ROLLUP_REROLL_HOURS = 2;
export const ROLLUP_CHUNK_HOURS = 24;
export const ROLLUP_RETENTION_MARGIN_HOURS = 2;
export const ROLLUP_RAW_TAIL_HOURS = 2;

export type CheckRollupUptime = z.infer<typeof checkRollupUptimeSchema>;
export type CheckRollupSumCount = z.infer<typeof checkRollupSumCountSchema>;
export type CheckRollupHardware = z.infer<typeof checkRollupHardwareSchema>;
export type CheckRollup = z.infer<typeof checkRollupSchema>;

export type UptimeRollupBucket = {
	_id: string;
	totalChecks: number;
	upChecks: number;
	downChecks: number;
	responseTimeSum: number;
	responseTimeCount: number;
	upResponseTimeSum: number;
	upResponseTimeCount: number;
	downResponseTimeSum: number;
	downResponseTimeCount: number;
} & CheckRollupUptime;
