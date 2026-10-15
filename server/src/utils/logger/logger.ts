import type { z } from "zod";
import pino, { type Logger as PinoLogger } from "pino";
import { logConfigSchema, logEntrySchema } from "@/utils/logger/logger.schema.js";
import { logContext } from "@/utils/logger/logContext.js";
import { RequestHandler } from "express";
import { randomUUID } from "node:crypto";
import { pinoHttp } from "pino-http";

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
	httpMiddleware(): RequestHandler;
}

const MAX_CACHE_SIZE = 1000;
const REQUEST_ID_PATTERN = /^[\w.-]{1,128}$/;

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
					const parsed = JSON.parse(line);
					if ("httpRequest" in parsed) return; // Don't cache pino-http request lines
					this.cacheLog(this.toLogEntry(parsed));
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
				mixin: () => logContext.getStore() ?? {},
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

	httpMiddleware(): RequestHandler {
		return pinoHttp({
			logger: this.pino,
			genReqId: (req, res) => {
				const incoming = req.headers["x-request-id"];
				const id = typeof incoming === "string" && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID();
				res.setHeader("X-Request-Id", id);
				return id;
			},
			autoLogging: { ignore: (req) => !req.url?.startsWith("/api/") },
			customLogLevel: (_req, res, err) => {
				if (err || res.statusCode >= 500) return "error";
				if (res.statusCode >= 400) return "warn";
				return "debug";
			},
			// Names unique to request lines, so the pretty-print ignore list and the cache filter can't catch app fields
			customAttributeKeys: { req: "httpRequest", res: "httpResponse", responseTime: "httpDurationMs" },
			customSuccessMessage: (req, res, responseTime) => `${req.method} ${req.url} ${res.statusCode} ${Math.round(responseTime)}ms`,
			serializers: {
				req: (req) => ({ id: req.id, method: req.method, url: req.url }), // no headers, no body
				res: (res) => ({ statusCode: res.statusCode }), // the default also logs response headers
			},
		});
	}

	private toLogEntry(line: Record<string, unknown>): LogEntry {
		const { level, message, timestamp, service, method, details, stack, err, ...rest } = line;
		const errStack = typeof err === "object" && err !== null ? (err as { stack?: unknown }).stack : undefined;
		// TODO: remove the merge once the legacy call shape is gone
		const merged = { ...rest, ...(details as Record<string, unknown> | undefined) };
		return {
			level: String(level),
			message: String(message ?? ""),
			timestamp: String(timestamp),
			service: typeof service === "string" ? service : undefined,
			method: typeof method === "string" ? method : undefined,
			details: Object.keys(merged).length > 0 ? merged : undefined,
			stack: typeof stack === "string" ? stack : typeof errStack === "string" ? errStack : undefined,
		};
	}
}

export default Logger;
