import type { z } from "zod";
import pino, { type Logger as PinoLogger } from "pino";
import type { logConfigSchema, logEntrySchema } from "@/utils/logger/logger.schema.js";
import { logContext } from "@/utils/logger/logContext.js";
import type { RequestHandler } from "express";
import { randomUUID } from "node:crypto";
import { pinoHttp } from "pino-http";
import type { LogLevel } from "@/domain/app-settings/app-settings.type.js";

export type LogFields = Record<string, unknown>;
type LogConfig = z.infer<typeof logConfigSchema>;
type LogEntry = z.infer<typeof logEntrySchema>;
type LogMethod = {
	(config: LogConfig): void; // legacy will be removed
	(fields: LogFields, message: string): void;
	(message: string): void;
};

export interface ILogger {
	info: LogMethod;
	warn: LogMethod;
	error: LogMethod;
	debug: LogMethod;
	cacheLog(entry: LogEntry): void;
	getLogs(): LogEntry[];
	setLogLevel(level: LogLevel): void;
	httpMiddleware(): RequestHandler;
	child(bindings: LogFields): ILogger;
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

	// A child wraps a pino child and shares the parent's cache, so getLogs() is the same on every logger.
	// Its lines still reach the cache: pino children write to the root logger's multistream.
	constructor(parent?: { pino: PinoLogger; logCache: LogEntry[] }) {
		if (parent) {
			this.pino = parent.pino;
			this.logCache = parent.logCache;
			return;
		}
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

	info(a: LogConfig | LogFields | string, b?: string) {
		this.write("info", a, b);
	}
	warn(a: LogConfig | LogFields | string, b?: string) {
		this.write("warn", a, b);
	}
	error(a: LogConfig | LogFields | string, b?: string) {
		this.write("error", a, b);
	}
	debug(a: LogConfig | LogFields | string, b?: string) {
		this.write("debug", a, b);
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

	setLogLevel(level: LogLevel): void {
		this.pino.level = level || "info";
	}

	private write(level: LogLevel, a: LogConfig | LogFields | string, b?: string) {
		if (typeof a === "string") return this.pino[level](a);
		if (typeof b === "string") return this.pino[level](a, b);
		const { message, service, method, details, stack } = a as LogConfig;
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
			autoLogging: { ignore: (req) => !req.url?.startsWith("/api/") || req.url.startsWith("/api/v1/health") },
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

	child(bindings: LogFields): ILogger {
		return new Logger({ pino: this.pino.child(bindings), logCache: this.logCache });
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
