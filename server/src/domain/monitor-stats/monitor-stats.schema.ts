import { z } from "zod";

export const monitorStatsSchema = z
	.object({
		id: z.string(),
		monitorId: z.string(),
		avgResponseTime: z.number(),
		maxResponseTime: z.number(),
		totalChecks: z.number(),
		totalUpChecks: z.number(),
		totalDownChecks: z.number(),
		uptimePercentage: z.number(),
		lastCheckTimestamp: z.number(),
		lastResponseTime: z.number(),
		timeOfLastFailure: z.number().optional(),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.meta({ id: "MonitorStats" });
