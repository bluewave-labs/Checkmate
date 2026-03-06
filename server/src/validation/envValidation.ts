import { z } from "zod";

const envSchema = z.object({
	// Server Configuration
	PORT: z.string().default("52345"),
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("debug"),

	// Database
	DB_CONNECTION_STRING: z.string().min(1, "Database connection string is required"),

	// JWT Authentication
	JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
	TOKEN_TTL: z.string().default("99d"),

	// Client Configuration
	CLIENT_HOST: z.string().url("CLIENT_HOST must be a valid URL"),

	// Optional
	ORIGIN: z.string().optional(),
});

export type ValidatedEnv = z.infer<typeof envSchema>;

export const validateEnv = (): ValidatedEnv => {
	const result = envSchema.safeParse(process.env);

	if (!result.success) {
		console.error("Environment validation failed:");
		console.error("");

		const errors = result.error.format();
		for (const [key, value] of Object.entries(errors)) {
			if (key !== "_errors" && value && typeof value === "object" && "_errors" in value) {
				console.error(`  ${key}: ${value._errors.join(", ")}`);
			}
		}

		console.error("Please check your .env file and ensure all required variables are set.");
		process.exit(1);
	}

	console.log("Environment variables validated successfully");
	return result.data;
};
