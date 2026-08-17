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
	error?: {
		message: string;
		name: string;
		stack?: string;
	};
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

const formatError = (error?: Error) => {
	if (!error) return undefined;

	return {
		message: error.message,
		name: error.name,
		stack: error.stack,
	};
};

/**
 * Keys whose values must never reach the console. Matched case-insensitively
 * against a substring of the key, so `newPassword` and `X-Api-Key` are covered
 * by `password` and `apikey` respectively.
 */
const SENSITIVE_KEY_PATTERNS = [
	"password",
	"secret",
	"token",
	"authorization",
	"apikey",
	"credential",
	"passphrase",
] as const;
type SensitiveKeyPattern = (typeof SENSITIVE_KEY_PATTERNS)[number];

const REDACTED = "[REDACTED]";

const isSensitiveKey = (key: string): boolean => {
	const normalized = key.toLowerCase().replace(/[-_]/g, "");
	return SENSITIVE_KEY_PATTERNS.some((pattern: SensitiveKeyPattern) =>
		normalized.includes(pattern)
	);
};

/**
 * Deep-copies a value with sensitive fields replaced by a placeholder. Guards
 * against cycles so a self-referencing payload cannot hang the logger, and
 * leaves non-plain objects (FormData, File, Blob) as a type marker rather than
 * walking them.
 *
 * `ancestors` tracks only the current path, so the same object appearing twice
 * as a sibling is still rendered in full — only a genuine cycle is cut.
 */
const redactSensitive = (value: unknown, ancestors: readonly object[] = []): unknown => {
	if (value === null || typeof value !== "object") return value;

	if (ancestors.includes(value)) return "[CIRCULAR]";

	if (
		typeof FormData !== "undefined" &&
		(value instanceof FormData || value instanceof Blob)
	) {
		return `[${value.constructor.name}]`;
	}

	const path = [...ancestors, value];

	if (Array.isArray(value)) {
		return value.map((item) => redactSensitive(item, path));
	}

	const prototype = Object.getPrototypeOf(value);
	if (prototype !== Object.prototype && prototype !== null) {
		return value;
	}

	const result: Record<string, unknown> = {};
	for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
		result[key] = isSensitiveKey(key) ? REDACTED : redactSensitive(entry, path);
	}
	return result;
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
		error: formatError(error),
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
			console.error("Error:", error);
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
