import { Mongoose } from "mongoose";
import mongoose from "mongoose";
import AppSettings from "@/domain/app-settings/app-settings.model.js";
import { runMigrations } from "@/db/migration/index.js";
import { ILogger } from "@/utils/logger/logger.js";
import { EnvConfig } from "@/domain/app-settings/app-settings.service.js";
const SERVICE_NAME = "MongoDB";
import { IDb } from "@/db/db.interface.js";
import { AppError, internalError } from "@/utils/AppError.js";

class MongoDB implements IDb<Mongoose> {
	static SERVICE_NAME = SERVICE_NAME;

	private logger: ILogger;
	private rootLogger: ILogger; // passed to runMigrations which creates its own children
	private envSettings: EnvConfig;
	private db: Mongoose | null;

	constructor(logger: ILogger, envSettings: EnvConfig) {
		this.rootLogger = logger;
		this.logger = logger.child({ service: SERVICE_NAME });
		this.envSettings = envSettings;
		this.db = null;
	}

	connect = async () => {
		try {
			const connectionString = this.envSettings.dbConnectionString || "mongodb://localhost:27017/uptime_db";
			this.db = await mongoose.connect(connectionString);
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
			await runMigrations(this.rootLogger);

			// Sync indexes
			const models = mongoose.modelNames();
			for (const modelName of models) {
				const model = mongoose.model(modelName);
				await model.syncIndexes();
			}

			this.logger.info("Connected to MongoDB");
		} catch (error: unknown) {
			this.logger.error({ err: error }, "Failed to connect to MongoDB");
			throw error;
		}
	};

	getConnection = async (): Promise<Mongoose> => {
		if (this.db === null) {
			throw new AppError(internalError, { message: "Database not connected", service: SERVICE_NAME, method: "getConnection" });
		}
		return this.db;
	};

	disconnect = async () => {
		try {
			this.logger.info("Disconnecting from MongoDB");
			await mongoose.disconnect();
			this.logger.info("Disconnected from MongoDB");
			return;
		} catch (error: unknown) {
			this.logger.error({ err: error }, "Failed to disconnect from MongoDB");
		}
	};
}

export default MongoDB;
