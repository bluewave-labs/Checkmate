import { z } from "zod";
import { DbTypes, QueueModes } from "@/domain/app-settings/app-settings.type.js";
import { booleanCoercion } from "@/api/validation/shared.js";
import { ILogger } from "@/utils/logger.js";

const envSchema = z.object({
	// Server Configuration
	PORT: z.string().default("52345"),
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("debug"),

	// Database
	DB_CONNECTION_STRING: z.string().min(1, "Database connection string is required"),
	DB_TYPE: z.enum(DbTypes).default("mongodb"),

	QUEUE_MODE: z.enum(QueueModes).default("primary"),
	QUEUE_PRIMARY_PROCESSES: booleanCoercion.default(true),

	// JWT Authentication
	JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
	TOKEN_TTL: z.string().default("99d"),

	// Client Configuration
	CLIENT_HOST: z.string().url("CLIENT_HOST must be a valid URL"),

	// Optional
	ORIGIN: z.string().optional(),

	// Feature flags
	STATUS_PAGE_THEMES_ENABLED: booleanCoercion.default(true),

	// Script monitor (optional – required only when script monitors are used)
	SCRIPT_ENCRYPTION_KEY: z
		.string()
		.regex(/^[0-9a-fA-F]{64}$/, "SCRIPT_ENCRYPTION_KEY must be 64 hex characters (32 bytes)")
		.optional(),
	PROBE_JWT_SECRET: z.string().min(32, "PROBE_JWT_SECRET must be at least 32 characters").optional(),
});

export type ValidatedEnv = z.infer<typeof envSchema>;

export const validateEnv = (logger: ILogger): ValidatedEnv => {
	const result = envSchema.safeParse(process.env);

	if (!result.success) {
		logger.error({
			message: "Env validation failed",
			method: "validateEnv",
			service: "Server",
		});

		const errors = result.error.format();
		for (const [key, value] of Object.entries(errors)) {
			if (key !== "_errors" && value && typeof value === "object" && "_errors" in value) {
				logger.error({
					message: `${key}: ${value._errors.join(", ")}`,
					method: "validateEnv",
					service: "Server",
				});
			}
		}

		logger.error({
			message: "Please check your .env file and ensure all required variables are set.",
			method: "validateEnv",
			service: "Server",
		});
		process.exit(1);
	}

	logger.info({
		message: "Environment variables validated successfully",
		method: "validateEnv",
		service: "Server",
	});
	return result.data;
};
