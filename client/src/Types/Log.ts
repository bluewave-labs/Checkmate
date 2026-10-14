export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];
export const LOG_LEVEL_OPTIONS = ["all", ...LOG_LEVELS] as const;
export type LogLevelOption = (typeof LOG_LEVEL_OPTIONS)[number];
// Mirrors the server's serializedErrorSchema: the caught error behind a log entry
export interface LogError {
	name: string;
	message: string;
	stack?: string;
	status?: number;
	service?: string;
	method?: string;
	details?: Record<string, unknown>;
	cause?: LogError;
}

// The request or job a log entry was written during
export interface LogContext {
	requestId?: string;
	userId?: string;
	teamId?: string;
	jobId?: string;
	jobType?: string;
	monitorId?: string;
}

export interface Log {
	message: string;
	service?: string;
	method?: string;
	details?: Record<string, unknown>;
	context?: LogContext;
	error?: LogError;
	level: LogLevel;
	timestamp: string;
}
