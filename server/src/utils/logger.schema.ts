import { z } from "zod";
import { LogLevels } from "@/domain/app-settings/app-settings.type.js";

export const logConfigSchema = z.object({
	message: z.string(),
	service: z.string().optional(),
	method: z.string().optional(),
	details: z.record(z.string(), z.unknown()).optional(),
	stack: z.string().optional(),
});

export const logEntrySchema = logConfigSchema
	.extend({
		level: z.enum(LogLevels),
		timestamp: z.string(),
	})
	.meta({ id: "LogEntry" });
