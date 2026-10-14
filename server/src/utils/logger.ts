import { createLogger, format, transports, Logger as WinstonLogger } from "winston";
import type { Logform } from "winston";
import type { z } from "zod";
import { serializedErrorSchema, type logConfigSchema, type logEntrySchema } from "@/utils/logger.schema.js";
import { LogLevel } from "@/domain/app-settings/app-settings.type.js";
import { getLogContext } from "@/utils/logContext.js";
import { redactError, redactRecord, redactString } from "@/utils/redact.js";
import { type SerializedError, serializeError } from "@/utils/serializedError.js";

const SERVICE_NAME = "Logger";
const MAX_CACHE_SIZE = 1000;
const FLUSH_TIMEOUT_MS = 2000;
const LEVEL_PRIORITY: Record<LogLevel, number> = { error: 0, warn: 1, info: 2, debug: 3 };

type LogConfig = z.infer<typeof logConfigSchema>;
type LogEntry = z.infer<typeof logEntrySchema>;

export type LoggerOptions = {
	level: LogLevel;
	json: boolean;
};

export interface ILogger {
	info(config: LogConfig): void;
	warn(config: LogConfig): void;
	error(config: LogConfig): void;
	debug(config: LogConfig): void;
	getLogs(): LogEntry[];
	configure(options: LoggerOptions): void;
	flush(): Promise<void>;
}

const jsonFormat = format.json();

const formatError = (error: SerializedError): string => {
	const head = error.stack ?? `${error.name}: ${error.message}`;
	return error.cause ? `${head}\nCaused by: ${formatError(error.cause)}` : head;
};

const prettyFormat = format.combine(
	format.colorize(),
	format.printf((info: Logform.TransformableInfo) => {
		const { timestamp, level, message, service, method, details, context, error } = info;
		let line = `${String(timestamp)} ${level}:`;
		if (service) line += ` [${String(service)}]`;
		if (method) line += `(${String(method)})`;
		line += ` ${String(message)}`;
		if (details) line += ` ${JSON.stringify(details)}`;
		if (context) line += ` ${JSON.stringify(context)}`;
		const parsedError = serializedErrorSchema.safeParse(error);
		if (parsedError.success) line += `\n${formatError(parsedError.data)}`;
		return line;
	})
);

const buildTransports = ({ json }: LoggerOptions) => [new transports.Console({ format: json ? jsonFormat : prettyFormat })];

class Logger implements ILogger {
	static SERVICE_NAME = SERVICE_NAME;

	private logger: WinstonLogger;
	private logCache: LogEntry[] = [];
	private level: LogLevel = "info";

	constructor(options: LoggerOptions = { level: "info", json: false }) {
		this.level = options.level;
		this.logger = createLogger({ level: options.level, transports: buildTransports(options) });
	}

	configure(options: LoggerOptions) {
		this.level = options.level;
		this.logger.configure({ level: options.level, transports: buildTransports(options) });
	}

	info = (config: LogConfig) => this.log("info", config);
	warn = (config: LogConfig) => this.log("warn", config);
	error = (config: LogConfig) => this.log("error", config);
	debug = (config: LogConfig) => this.log("debug", config);

	getLogs() {
		return [...this.logCache];
	}

	flush(): Promise<void> {
		return new Promise((resolve) => {
			const timer = setTimeout(resolve, FLUSH_TIMEOUT_MS);
			this.logger.once("finish", () => {
				// Winston is done; wait for stdout to drain before the caller exits
				process.stdout.write("", () => {
					clearTimeout(timer);
					resolve();
				});
			});
			this.logger.end();
		});
	}

	private buildLogEntry(level: LogLevel, config: LogConfig): LogEntry {
		const context = getLogContext();
		return {
			level,
			timestamp: new Date().toISOString(),
			message: redactString(config.message),
			service: config.service,
			method: config.method,
			...(context && { context: { ...context } }),
			...(config.details && { details: redactRecord(config.details) }),
			...(config.error !== undefined && { error: redactError(serializeError(config.error)) }),
		};
	}

	private cacheLog(entry: LogEntry) {
		this.logCache.push(entry);
		if (this.logCache.length > MAX_CACHE_SIZE) {
			this.logCache.shift();
		}
	}

	private log(level: LogLevel, config: LogConfig) {
		if (LEVEL_PRIORITY[level] > LEVEL_PRIORITY[this.level]) return;
		const entry = this.buildLogEntry(level, config);
		this.cacheLog(entry);
		this.logger.log(entry);
	}
}

export default Logger;
