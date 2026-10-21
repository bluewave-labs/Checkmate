import type { z } from "zod";
import type { monitorStatsSchema } from "@/domain/monitor-stats/monitor-stats.schema.js";

export interface CheckResultInput {
	status: boolean;
	responseTime: number;
	now: number;
}

export type MonitorStats = z.infer<typeof monitorStatsSchema>;
