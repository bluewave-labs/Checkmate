import mongoose from "mongoose";
import AppSettings from "@/db/models/AppSettings.js";
import { runMigrations } from "@/db/migration/index.js";
import { ILogger } from "@/utils/logger.js";
import { EnvConfig } from "@/service/system/settingsService.js";
const SERVICE_NAME = "MongoDB";
import { IDb } from "@/db/IDb.js";

class MongoDB implements IDb {
	static SERVICE_NAME = SERVICE_NAME;

	private logger: ILogger;
	private envSettings: EnvConfig;

	constructor(logger: ILogger, envSettings: EnvConfig) {
		this.logger = logger;
		this.envSettings = envSettings;
	}

	get serviceName() {
		return MongoDB.SERVICE_NAME;
	}

	connect = async () => {
		try {
			const connectionString = this.envSettings.dbConnectionString || "mongodb://localhost:27017/uptime_db";

			// Enhanced connection options with retry logic, pooling, and timeouts
			const connectionOptions = {
				maxPoolSize: 10, // Maximum number of connections in the connection pool
				minPoolSize: 5, // Minimum number of connections in the connection pool
				maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
				serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10 seconds
				socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
				bufferCommands: false, // Disable mongoose buffering
				retryWrites: true, // Enable retryable writes
				retryReads: true, // Enable retryable reads
			};

			await mongoose.connect(connectionString, connectionOptions);
			// If there are no AppSettings, create one // TODO why is this here?
			await AppSettings.findOneAndUpdate(
				{}, // empty filter to match any document
				{}, // empty update
				{
					new: true,
					setDefaultsOnInsert: true,
				}
			);
			// Sync indexes
			const models = mongoose.modelNames();
			for (const modelName of models) {
				const model = mongoose.model(modelName);
				await model.syncIndexes();
			}

			this.logger.info({
				message: "Connected to MongoDB",
				service: SERVICE_NAME,
				method: "connect",
			});

			await runMigrations();
		} catch (error: unknown) {
			this.logger.error({
				message: error instanceof Error ? error.message : "Unknown error",
				service: SERVICE_NAME,
				method: "connect",
				stack: error instanceof Error ? error.stack : undefined,
			});
			throw error;
		}
	};

	disconnect = async () => {
		try {
			this.logger.info({ message: "Disconnecting from MongoDB", service: SERVICE_NAME, method: "disconnect" });
			await mongoose.disconnect();
			this.logger.info({ message: "Disconnected from MongoDB", service: SERVICE_NAME, method: "disconnect" });
			return;
		} catch (error: unknown) {
			this.logger.error({
				message: error instanceof Error ? error.message : "Unknown error",
				service: SERVICE_NAME,
				method: "disconnect",
				stack: error instanceof Error ? error.stack : undefined,
			});
		}
	};
}

export default MongoDB;
