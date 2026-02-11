import mongoose from "mongoose";
import AppSettings from "./models/AppSettings.js";
import { runMigrations } from "./migration/index.js";
import { ILogger } from "@/utils/logger.js";
import { EnvConfig } from "@/service/system/settingsService.js";
const SERVICE_NAME = "MongoDB";
class MongoDB {
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
		} catch (error: any) {
			this.logger.error({
				message: error.message,
				service: SERVICE_NAME,
				method: "connect",
				stack: error.stack,
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
		} catch (error: any) {
			this.logger.error({
				message: error.message,
				service: SERVICE_NAME,
				method: "disconnect",
				stack: error.stack,
			});
		}
	};
}

export default MongoDB;
