import { z } from "zod";

export const logConfigSchema = z.object({
	message: z.string(),
	service: z.string().optional(),
	method: z.string().optional(),
	details: z.record(z.string(), z.unknown()).optional(),
	stack: z.string().optional(),
});

export const logEntrySchema = logConfigSchema
	.extend({
		level: z.string(),
		timestamp: z.string(),
	})
	.meta({ id: "LogEntry" });
