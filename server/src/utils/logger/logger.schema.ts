import { z } from "zod";

export const logEntrySchema = z
	.object({
		level: z.string(),
		timestamp: z.string(),
		message: z.string(),
		service: z.string().optional(),
		details: z.record(z.string(), z.unknown()).optional(),
		stack: z.string().optional(),
	})
	.meta({ id: "LogEntry" });
