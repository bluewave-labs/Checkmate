import type { LogLevel } from "@/Types/Log";

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

const configuredLevel: LogLevel = import.meta.env.VITE_APP_LOG_LEVEL || "error";
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
		context,
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
			console.log("Context:", context);
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
			console.log("Context:", context);
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
		console.log(data);
	}
	console.groupEnd();
};

const info = (message: string, data?: any): void => {
	if (!shouldLog("info")) return;

	if (configuredLevel === "debug") {
		console.log(`INFO: ${message}`, data);
	} else {
		const logData = {
			timestamp: new Date().toISOString(),
			level: "info" as LogLevel,
			message,
			data,
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
