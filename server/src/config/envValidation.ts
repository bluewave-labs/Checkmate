import { isIP } from "node:net";
import { z } from "zod";
import { DbTypes, LogLevels, NodeEnvs, QueueModes, TrustProxyKeywords, type TrustProxy } from "@/domain/app-settings/app-settings.type.js";
import { booleanCoercion } from "@/api/validation/shared.js";
import { ILogger } from "@/utils/logger.js";

// Padded standard base64 of exactly 32 bytes, as produced by `openssl rand -base64 32`
const ENCRYPTION_KEY_ENTRY = /^[A-Za-z0-9+/]{43}=$/;

export const encryptionKeyList = z
	.string()
	.optional()
	.transform((raw, ctx) => {
		if (raw === undefined) return [];
		const entries = raw
			.split(",")
			.map((entry, index) => ({ entry: entry.trim(), slot: index + 1 }))
			.filter(({ entry }) => entry.length > 0);
		const seen = new Set<string>();
		const keys: Buffer[] = [];
		entries.forEach(({ entry, slot }) => {
			if (!ENCRYPTION_KEY_ENTRY.test(entry)) {
				ctx.addIssue({
					code: "custom",
					message: `ENCRYPTION_KEY entry ${slot} must be 32 bytes as padded standard base64 (openssl rand -base64 32)`,
				});
				return;
			}
			const decoded = Buffer.from(entry, "base64");
			const fingerprint = decoded.toString("hex");
			if (seen.has(fingerprint)) {
				ctx.addIssue({ code: "custom", message: `ENCRYPTION_KEY entry ${slot} duplicates an earlier entry` });
			}
			seen.add(fingerprint);
			keys.push(decoded);
		});
		return keys;
	});

const isTrustProxyEntry = (entry: string): boolean => {
	if ((TrustProxyKeywords as readonly string[]).includes(entry)) return true;
	const [address, prefix, ...rest] = entry.split("/");
	if (rest.length > 0 || !address || isIP(address) === 0) return false;
	return prefix === undefined || /^\d+$/.test(prefix);
};

// Unset leaves trust proxy off. Validated here because Express only rejects a bad value when it compiles it, as a startup crash
export const trustProxySetting = z
	.string()
	.optional()
	.transform((raw, ctx): TrustProxy | undefined => {
		const value = raw?.trim();
		if (!value) return undefined;
		if (/^\d+$/.test(value)) return Number(value);
		const entries = value
			.split(",")
			.map((entry) => entry.trim())
			.filter((entry) => entry.length > 0);
		const invalid = entries.filter((entry) => !isTrustProxyEntry(entry));
		if (invalid.length > 0) {
			ctx.addIssue({
				code: "custom",
				message: `TRUST_PROXY must be a hop count such as 1, or a comma-separated list of IPs, CIDRs or ${TrustProxyKeywords.join("/")}. Invalid: ${invalid.join(", ")}`,
			});
			return z.NEVER;
		}
		return entries;
	});

const envSchema = z.object({
	// Server Configuration
	PORT: z.string().default("52345"),
	// Port for worker health checks
	HEALTH_PORT: z.string().default("52346"),
	// Unset defaults to production so upgrades without it keep running with production behaviour; validateEnv warns
	NODE_ENV: z.enum(NodeEnvs).default("production"),
	LOG_LEVEL: z.enum(LogLevels).default("info"),

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
	TRUST_PROXY: trustProxySetting,

	// Feature flags
	STATUS_PAGE_THEMES_ENABLED: booleanCoercion.default(true),

	// Encryption
	ENCRYPTION_KEY: encryptionKeyList,
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

	if (process.env.NODE_ENV === undefined) {
		logger.warn({
			message: 'NODE_ENV is not set, defaulting to "production". Set NODE_ENV=development for local development.',
			method: "validateEnv",
			service: "Server",
		});
	}

	const legacyClientVars = Object.keys(process.env).filter((key) => key.startsWith("UPTIME_APP_"));
	if (legacyClientVars.length > 0) {
		logger.warn({
			message: `${legacyClientVars.join(", ")} no longer configure the client and will be ignored. The client defaults to the origin it is served from; to override, use CLIENT_CONFIG_API_BASE_URL, CLIENT_CONFIG_CLIENT_HOST, or CLIENT_CONFIG_LOG_LEVEL.`,
			method: "validateEnv",
			service: "Server",
		});
	}

	logger.info({
		message: "Environment variables validated successfully",
		method: "validateEnv",
		service: "Server",
	});
	return result.data;
};
