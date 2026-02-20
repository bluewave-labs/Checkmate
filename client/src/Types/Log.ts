export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];
export const LOG_LEVEL_OPTIONS = ["all", ...LOG_LEVELS] as const;
export type LogLevelOption = (typeof LOG_LEVEL_OPTIONS)[number];
export interface Log {
	message: string;
	service?: string;
	method?: string;
	details?: Record<string, unknown>;
	stack?: string;
	level: LogLevel;
	timestamp: string;
}
