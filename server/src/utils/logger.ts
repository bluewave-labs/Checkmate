import type { z } from "zod";
import pino, { type Logger as PinoLogger } from "pino";
import type { logConfigSchema, logEntrySchema } from "./logger.schema.js";

type LogConfig = z.infer<typeof logConfigSchema>;
type LogEntry = z.infer<typeof logEntrySchema>;

export interface ILogger {
	info(config: LogConfig): void;
	warn(config: LogConfig): void;
	error(config: LogConfig): void;
	debug(config: LogConfig): void;
	cacheLog(entry: LogEntry): void;
	getLogs(): LogEntry[];
	buildLogEntry(level: string, config: LogConfig): LogEntry;
	setLogLevel(level: string): void;
}

const MAX_CACHE_SIZE = 1000;

// Secret-bearing field names used in the app. Matched at the top level (new call shape), one level down and two
// levels down (legacy calls nest fields under `details`).
const SECRET_KEYS = [
	"password",
	"newPassword",
	"accessToken",
	"secret",
	"jwtSecret",
	"systemEmailPassword",
	"pagespeedApiKey",
	"dockerTlsKey",
	"token",
];
const REDACT_PATHS = SECRET_KEYS.flatMap((key) => [key, `*.${key}`, `*.*.${key}`]);

class Logger implements ILogger {
	private pino: PinoLogger;
	private logCache: LogEntry[] = [];

	constructor() {
		const cacheStream = {
			write: (line: string) => {
				try {
					this.cacheLog(this.toLogEntry(JSON.parse(line)));
				} catch {
					// A line that is not JSON is never produced by pino, ignore
				}
			},
		};

		this.pino = pino(
			{
				level: "info",
				messageKey: "message",
				timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
				formatters: {
					level: (label) => ({ level: label }),
				},
				base: undefined, // omit pid and hostname
				serializers: { err: pino.stdSerializers.errWithCause },
				redact: { paths: REDACT_PATHS, censor: "[Redacted]" },
			},
			pino.multistream([
				{ stream: process.stdout, level: "debug" },
				{ stream: cacheStream, level: "debug" },
			])
		);
	}

	info(config: LogConfig) {
		this.write("info", config);
	}
	warn(config: LogConfig) {
		this.write("warn", config);
	}
	error(config: LogConfig) {
		this.write("error", config);
	}
	debug(config: LogConfig) {
		this.write("debug", config);
	}

	cacheLog(entry: LogEntry) {
		this.logCache.push(entry);
		if (this.logCache.length > MAX_CACHE_SIZE) {
			this.logCache.shift();
		}
	}

	getLogs() {
		return this.logCache;
	}

	setLogLevel(level: string): void {
		this.pino.level = level || "info";
	}

	buildLogEntry(level: string, config: LogConfig): LogEntry {
		return { level, ...config, timestamp: new Date().toISOString() };
	}

	private write(level: "info" | "warn" | "error" | "debug", config: LogConfig) {
		const { message, service, method, details, stack } = config;
		// Under err so pino-pretty lays the stack out on separate lines, and legacy and new-style errors share one shape
		this.pino[level]({ service, method, details, ...(stack && { err: { stack } }) }, message);
	}

	private toLogEntry(line: Record<string, unknown>): LogEntry {
		const { level, message, timestamp, service, method, details, stack, err, ...rest } = line;
		const errStack = typeof err === "object" && err !== null ? (err as { stack?: unknown }).stack : undefined;
		const extra = Object.keys(rest).length > 0 ? rest : undefined;
		return {
			level: String(level),
			message: String(message ?? ""),
			timestamp: String(timestamp),
			service: typeof service === "string" ? service : undefined,
			method: typeof method === "string" ? method : undefined,
			details: (details as Record<string, unknown> | undefined) ?? extra,
			stack: typeof stack === "string" ? stack : typeof errStack === "string" ? errStack : undefined,
		};
	}
}

export default Logger;
