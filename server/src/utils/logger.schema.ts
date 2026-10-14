import { z } from "zod";
import { LogLevels } from "@/domain/app-settings/app-settings.type.js";

export const serializedErrorSchema = z
	.object({
		name: z.string(),
		message: z.string(),
		stack: z.string().optional(),
		status: z.number().optional(),
		service: z.string().optional(),
		method: z.string().optional(),
		details: z.record(z.string(), z.unknown()).optional(),
		code: z.union([z.string(), z.number()]).optional(),
		errno: z.number().optional(),
		syscall: z.string().optional(),
		address: z.string().optional(),
		port: z.number().optional(),
		get cause() {
			return serializedErrorSchema.optional();
		},
		get errors() {
			return z.array(serializedErrorSchema).optional();
		},
	})
	.meta({ id: "SerializedError" });

export const logContextSchema = z.object({
	requestId: z.string().optional(),
	userId: z.string().optional(),
	teamId: z.string().optional(),
	jobId: z.string().optional(),
	jobType: z.string().optional(),
	monitorId: z.string().optional(),
});

export const logConfigSchema = z.object({
	message: z.string(),
	service: z.string().optional(),
	method: z.string().optional(),
	details: z.record(z.string(), z.unknown()).optional(),
	error: z.unknown().optional(),
});

export const logEntrySchema = logConfigSchema
	.omit({ error: true })
	.extend({
		level: z.enum(LogLevels),
		timestamp: z.string(),
		context: logContextSchema.optional(),
		error: serializedErrorSchema.optional(),
	})
	.meta({ id: "LogEntry" });
