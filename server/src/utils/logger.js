import { createLogger, format, transports } from "winston";
import dotenv from "dotenv";
dotenv.config();

const SERVICE_NAME = "Logger";

class Logger {
	static SERVICE_NAME = SERVICE_NAME;
	constructor({ envSettings }) {
		this.envSettings = envSettings;
		this.logCache = [];
		this.maxCacheSize = 1000;
		const consoleFormat = format.printf(({ level, message, service, method, details, timestamp, stack }) => {
			if (message instanceof Object) {
				message = JSON.stringify(message, null, 2);
			}

			if (details instanceof Object) {
				details = JSON.stringify(details, null, 2);
			}
			let msg = `${timestamp} ${level}:`;
			service && (msg += ` [${service}]`);
			method && (msg += `(${method})`);
			message && (msg += ` ${message}`);
			details && (msg += ` (details: ${details})`);

			if (typeof stack !== "undefined") {
				const stackTrace = stack
					?.split("\n")
					.slice(1) // Remove first line (error message)
					.map((line) => {
						const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
						if (match) {
							return {
								function: match[1],
								file: match[2],
								line: parseInt(match[3]),
								column: parseInt(match[4]),
							};
						}
						return line.trim();
					});
				stack && (msg += ` (stack: ${JSON.stringify(stackTrace, null, 2)})`);
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

	/**
	 * Logs an informational message.
	 * @param {Object} config - The configuration object.
	 * @param {string} config.message - The message to log.
	 * @param {string} config.service - The service name.
	 * @param {string} config.method - The method name.
	 * @param {Object} config.details - Additional details.
	 */
	info(config) {
		const logEntry = this.buildLogEntry("info", config);
		this.cacheLog(logEntry);
		this.logger.info(logEntry);
	}

	/**
	 * Logs a warning message.
	 * @param {Object} config - The configuration object.
	 * @param {string} config.message - The message to log.
	 * @param {string} config.service - The service name.
	 * @param {string} config.method - The method name.
	 * @param {Object} config.details - Additional details.
	 */
	warn(config) {
		const logEntry = this.buildLogEntry("warn", config);
		this.cacheLog(logEntry);
		this.logger.warn(logEntry);
	}

	/**
	 * Logs an error message.
	 * @param {Object} config - The configuration object.
	 * @param {string} config.message - The message to log.
	 * @param {string} config.service - The service name.
	 * @param {string} config.method - The method name.
	 * @param {Object} config.details - Additional details.
	 */
	error(config) {
		const logEntry = this.buildLogEntry("error", config);
		this.cacheLog(logEntry);
		this.logger.error(logEntry);
	}
	/**
	 * Logs a debug message.
	 * @param {Object} config - The configuration object.
	 * @param {string} config.message - The message to log.
	 * @param {string} config.service - The service name.
	 * @param {string} config.method - The method name.
	 * @param {Object} config.details - Additional details.
	 */
	debug(config) {
		const logEntry = this.buildLogEntry("debug", config);
		this.cacheLog(logEntry);
		this.logger.debug(logEntry);
	}

	cacheLog(entry) {
		this.logCache.push(entry);
		if (this.logCache.length > this.maxCacheSize) {
			this.logCache.shift();
		}
	}

	getLogs() {
		return this.logCache;
	}

	buildLogEntry(level, config) {
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
