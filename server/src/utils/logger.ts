import { createLogger, format, transports, Logger as WinstonLogger } from "winston";
import type { Logform } from "winston";
import dotenv from "dotenv";
import { EnvConfig } from "@/service/system/settingsService.js";
dotenv.config();

const SERVICE_NAME = "Logger";

interface LogConfig {
	message: string;
	service?: string;
	method?: string;
	details?: Record<string, unknown>;
	stack?: string;
}

interface LogEntry extends LogConfig {
	level: string;
	timestamp: string;
}

export interface ILogger {
	readonly serviceName: string;
	info(config: LogConfig): void;
	warn(config: LogConfig): void;
	error(config: LogConfig): void;
	debug(config: LogConfig): void;
	cacheLog(entry: LogEntry): void;
	getLogs(): LogEntry[];
	buildLogEntry(level: string, config: LogConfig): LogEntry;
}

class Logger implements ILogger {
	static SERVICE_NAME = SERVICE_NAME;

	private logger: WinstonLogger;
	private envSettings: Partial<EnvConfig>;
	private logCache: LogEntry[];
	private maxCacheSize: number;

	constructor({ envSettings }: { envSettings: Partial<EnvConfig> }) {
		this.envSettings = envSettings;
		this.logCache = [];
		this.maxCacheSize = 1000;
		const consoleFormat = format.printf((info: Logform.TransformableInfo) => {
			const { level, service, method, details, timestamp, stack } = info;
			const message = info.message as string;
			let formattedMessage: string = message;
			let formattedDetails: string | undefined;

			if (typeof message === "object" && message !== null) {
				formattedMessage = JSON.stringify(message, null, 2);
			}

			if (typeof details === "object" && details !== null) {
				formattedDetails = JSON.stringify(details, null, 2);
			}

			let msg = `${timestamp} ${level}:`;
			if (service) msg += ` [${service}]`;
			if (method) msg += `(${method})`;
			if (formattedMessage) msg += ` ${formattedMessage}`;
			if (formattedDetails) msg += ` (details: ${formattedDetails})`;

			if (typeof stack === "string") {
				const stackTrace = stack
					.split("\n")
					.slice(1) // Remove first line (error message)
					.map((line: string) => {
						const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
						if (match) {
							return {
								function: match[1],
								file: match[2],
								line: parseInt(match[3] ?? "0", 10),
								column: parseInt(match[4] ?? "0", 10),
							};
						}
						return line.trim();
					});
				msg += ` (stack: ${JSON.stringify(stackTrace, null, 2)})`;
			}

			return msg;
		});

		const logLevel = this.envSettings.logLevel || "info";

		this.logger = createLogger({
			level: logLevel,
			format: format.combine(format.timestamp()),
			transports: [
				new transports.Console({
					format: format.combine(format.colorize(), format.prettyPrint(), format.json(), consoleFormat),
				}),
				new transports.File({
					format: format.combine(format.json()),
					filename: "app.log",
				}),
			],
		});
	}

	get serviceName() {
		return Logger.SERVICE_NAME;
	}

	info(config: LogConfig) {
		const logEntry = this.buildLogEntry("info", config);
		this.cacheLog(logEntry);
		this.logger.info(logEntry);
	}

	warn(config: LogConfig) {
		const logEntry = this.buildLogEntry("warn", config);
		this.cacheLog(logEntry);
		this.logger.warn(logEntry);
	}

	error(config: LogConfig) {
		const logEntry = this.buildLogEntry("error", config);
		this.cacheLog(logEntry);
		this.logger.error(logEntry);
	}

	debug(config: LogConfig) {
		const logEntry = this.buildLogEntry("debug", config);
		this.cacheLog(logEntry);
		this.logger.debug(logEntry);
	}

	cacheLog(entry: LogEntry) {
		this.logCache.push(entry);
		if (this.logCache.length > this.maxCacheSize) {
			this.logCache.shift();
		}
	}

	getLogs() {
		return this.logCache;
	}

	buildLogEntry(level: string, config: LogConfig): LogEntry {
		return {
			level,
			message: config.message,
			service: config.service,
			method: config.method,
			details: config.details,
			stack: config.stack,
			timestamp: new Date().toISOString(),
		};
	}
}

export default Logger;

// Legacy logger
const logger = new Logger({ envSettings: { logLevel: "debug" } });
export { logger };
export type { LogConfig, LogEntry };
