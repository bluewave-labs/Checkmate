import type { LogLevel } from "@/Types/Log";
import { runtimeConfig } from "@/Utils/runtimeConfig";

interface LogContext {
	[key: string]: any;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
};

interface ErrorLogData {
	timestamp: string;
	level: LogLevel;
	message: string;
	error?: Record<string, unknown>;
	context?: LogContext;
	url: string;
	userAgent: string;
}

const configuredLevel: LogLevel =
	runtimeConfig.logLevel || import.meta.env.VITE_APP_LOG_LEVEL || "error";
const configuredPriority = LOG_LEVEL_PRIORITY[configuredLevel];

const shouldLog = (level: LogLevel): boolean => {
	return LOG_LEVEL_PRIORITY[level] >= configuredPriority;
};

/**
 * Keys whose values must never reach the console. Matched case-insensitively
 * against a substring of the key, so `newPassword` and `X-Api-Key` are covered
 * by `password` and `apikey` respectively.
 */
const SENSITIVE_KEY_PATTERNS = [
	"password",
	"passwd",
	"pwd",
	"secret",
	"token",
	"authorization",
	"apikey",
	"credential",
	"passphrase",
	"cookie",
	"jwt",
	"privatekey",
	"sessionid",
	"csrf",
] as const;

const REDACTED = "[REDACTED]";

const isSensitiveKey = (key: string): boolean => {
	const normalized = key.toLowerCase().replace(/[-_]/g, "");
	return SENSITIVE_KEY_PATTERNS.some((pattern) => normalized.includes(pattern));
};

/**
 * Opaque browser types that must not be walked: they carry no useful log data
 * and may hold large buffers. Resolved defensively because these globals are
 * absent in SSR and some test environments.
 */
const isOpaqueObject = (value: object): boolean => {
	const opaqueTypes = ["FormData", "Blob", "File", "ArrayBuffer"] as const;
	return opaqueTypes.some((name) => {
		const ctor = (globalThis as Record<string, unknown>)[name];
		return typeof ctor === "function" && value instanceof (ctor as new () => object);
	});
};

/**
 * Deep-copies a value with sensitive fields replaced by a placeholder. Walks
 * class instances as well as object literals, so a credential on a DTO is
 * redacted too. Opaque types (FormData, Blob) render as a type marker.
 *
 * `ancestors` tracks only the current path, so the same object appearing twice
 * as a sibling is still rendered in full — only a genuine cycle is cut.
 */
const redactSensitive = (value: unknown, ancestors: readonly object[] = []): unknown => {
	if (value === null || typeof value !== "object") return value;

	if (ancestors.includes(value)) return "[CIRCULAR]";

	if (isOpaqueObject(value)) return `[${value.constructor?.name ?? "Object"}]`;

	// Dates and RegExps stringify usefully on their own; walking them yields nothing.
	if (value instanceof Date || value instanceof RegExp) return value;

	const path = [...ancestors, value];

	if (Array.isArray(value)) {
		return value.map((item) => redactSensitive(item, path));
	}

	// Walk own enumerable properties of ANY object, including class instances —
	// a credential on a DTO must be redacted just as it is on an object literal.
	const result: Record<string, unknown> = {};
	for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
		result[key] = isSensitiveKey(key) ? REDACTED : redactSensitive(entry, path);
	}
	return result;
};

/**
 * Parses a serialized request body so its fields can be redacted by key. A body
 * that is not JSON is replaced wholesale rather than logged raw, since an
 * unparseable payload (e.g. form-encoded) may still carry credentials.
 */
const safeJsonParse = (raw: string): unknown => {
	try {
		const parsed = JSON.parse(raw);
		return typeof parsed === "object" && parsed !== null ? parsed : "[UNPARSED BODY]";
	} catch {
		return "[UNPARSED BODY]";
	}
};

/**
 * Errors are logged as-is by the debug branches, but an AxiosError carries the
 * outgoing request on `config` — including the serialized body and the
 * Authorization header — so the raw object cannot be handed to the console.
 * Returns a redacted plain object safe to print.
 */
const toSafeError = (error: Error): Record<string, unknown> => {
	const candidate = error as unknown as {
		config?: { url?: string; method?: string; data?: unknown; headers?: unknown };
		response?: { status?: number };
	};

	const safe: Record<string, unknown> = {
		name: error.name,
		message: error.message,
		stack: error.stack,
	};

	if (candidate.config) {
		const { url, method, data, headers } = candidate.config;
		safe.config = {
			url,
			method,
			// Axios serializes the request body to a string, so key-based
			// redaction cannot reach into it — parse it back first.
			data: redactSensitive(typeof data === "string" ? safeJsonParse(data) : data),
			headers: redactSensitive(headers),
		};
		safe.status = candidate.response?.status;
	}

	return redactSensitive(safe) as Record<string, unknown>;
};

const createLogData = (
	level: LogLevel,
	message: string,
	error?: Error,
	context?: LogContext
): ErrorLogData => {
	return {
		timestamp: new Date().toISOString(),
		level,
		message,
		error: error === undefined ? undefined : toSafeError(error),
		context: context === undefined ? undefined : (redactSensitive(context) as LogContext),
		url: window.location.href,
		userAgent: navigator.userAgent,
	};
};

const error = (message: string, error?: Error, context?: LogContext): void => {
	if (!shouldLog("error")) return;

	const logData = createLogData("error", message, error, context);

	if (configuredLevel === "debug") {
		console.group(`ERROR: ${message}`);
		if (error) {
			console.error("Error:", toSafeError(error));
		}
		if (context && Object.keys(context).length > 0) {
			console.log("Context:", logData.context);
		}
		console.log("URL:", logData.url);
		console.log("Timestamp:", logData.timestamp);
		console.groupEnd();
	} else {
		console.error(JSON.stringify(logData));
	}
};

const warn = (message: string, context?: LogContext): void => {
	if (!shouldLog("warn")) return;

	const logData = createLogData("warn", message, undefined, context);

	if (configuredLevel === "debug") {
		console.group(`WARN: ${message}`);
		if (context && Object.keys(context).length > 0) {
			console.log("Context:", logData.context);
		}
		console.groupEnd();
	} else {
		console.warn(JSON.stringify(logData));
	}
};

const debug = (message: string, data?: any): void => {
	if (!shouldLog("debug")) return;

	console.group(`DEBUG: ${message}`);
	if (data !== undefined) {
		console.log(redactSensitive(data));
	}
	console.groupEnd();
};

const info = (message: string, data?: any): void => {
	if (!shouldLog("info")) return;

	const safeData = data === undefined ? undefined : redactSensitive(data);

	if (configuredLevel === "debug") {
		console.log(`INFO: ${message}`, safeData);
	} else {
		const logData = {
			timestamp: new Date().toISOString(),
			level: "info" as LogLevel,
			message,
			data: safeData,
		};
		console.log(JSON.stringify(logData));
	}
};

export interface ILogger {
	error(message: string, error?: Error, context?: LogContext): void;
	warn(message: string, context?: LogContext): void;
	debug(message: string, data?: any): void;
	info(message: string, data?: any): void;
}

export const logger: ILogger = {
	error,
	warn,
	debug,
	info,
};
