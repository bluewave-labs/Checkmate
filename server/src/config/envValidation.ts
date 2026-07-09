import { z } from "zod";
import { DbTypes, LogLevels, QueueModes } from "@/domain/app-settings/app-settings.type.js";
import { booleanCoercion } from "@/api/validation/shared.js";
import { ILogger } from "@/utils/logger.js";

const envSchema = z.object({
	// Server Configuration
	PORT: z.string().default("52345"),
	// Port for worker health checks
	HEALTH_PORT: z.string().default("52346"),
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	LOG_LEVEL: z.enum(LogLevels).default("debug"),

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

	// Client runtime config overrides, rendered into GET /config.js; unset keys are
	// omitted and the client uses its same-origin defaults
	CLIENT_CONFIG_API_BASE_URL: z.string().optional(),
	CLIENT_CONFIG_CLIENT_HOST: z.string().url("CLIENT_CONFIG_CLIENT_HOST must be a valid URL").optional(),
	CLIENT_CONFIG_LOG_LEVEL: z.enum(LogLevels).optional(),

	// Optional
	ORIGIN: z.string().optional(),

	// Feature flags
	STATUS_PAGE_THEMES_ENABLED: booleanCoercion.default(true),
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
