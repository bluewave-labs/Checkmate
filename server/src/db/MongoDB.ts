import mongoose from "mongoose";
import AppSettings from "@/db/models/AppSettings.js";
import { runMigrations } from "@/db/migration/index.js";
import { ILogger } from "@/utils/logger.js";
import { EnvConfig } from "@/service/system/settingsService.js";
const SERVICE_NAME = "MongoDB";
import { IDb } from "@/db/IDb.js";
import { Pool } from "pg";

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
			await mongoose.connect(connectionString);
			// If there are no AppSettings, create one // TODO why is this here?
			await AppSettings.findOneAndUpdate(
				{}, // empty filter to match any document
				{}, // empty update
				{
					new: true,
					setDefaultsOnInsert: true,
				}
			);
			// Run migrations BEFORE syncIndexes. The 0006 dedupe migration must run before
			// the unique index on MonitorStats.monitorId is enforced, otherwise databases
			// with stray duplicates (caused by the pre-fix race in updateRunningStats)
			// will crash at startup when the unique index fails to build.
			await runMigrations();

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

	getPool = () => {
		return null;
	};
}

export default MongoDB;
