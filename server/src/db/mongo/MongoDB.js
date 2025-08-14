import mongoose from "mongoose";
import AppSettings from "../models/AppSettings.js";

class MongoDB {
	static SERVICE_NAME = "MongoDB";

	constructor({
		logger,
		envSettings,
		checkModule,
		inviteModule,
		statusPageModule,
		userModule,
		hardwareCheckModule,
		maintenanceWindowModule,
		monitorModule,
		networkCheckModule,
		notificationModule,
		pageSpeedCheckModule,
		recoveryModule,
		settingsModule,
	}) {
		this.logger = logger;
		this.envSettings = envSettings;
		this.userModule = userModule;
		this.inviteModule = inviteModule;
		this.recoveryModule = recoveryModule;
		this.pageSpeedCheckModule = pageSpeedCheckModule;
		this.hardwareCheckModule = hardwareCheckModule;
		this.checkModule = checkModule;
		this.maintenanceWindowModule = maintenanceWindowModule;
		this.monitorModule = monitorModule;
		this.notificationModule = notificationModule;
		this.settingsModule = settingsModule;
		this.statusPageModule = statusPageModule;
		this.networkCheckModule = networkCheckModule;
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
				service: this.SERVICE_NAME,
				method: "connect",
			});
		} catch (error) {
			this.logger.error({
				message: error.message,
				service: this.SERVICE_NAME,
				method: "connect",
				stack: error.stack,
			});
			throw error;
		}
	};

	disconnect = async () => {
		try {
			this.logger.info({ message: "Disconnecting from MongoDB" });
			await mongoose.disconnect();
			this.logger.info({ message: "Disconnected from MongoDB" });
			return;
		} catch (error) {
			this.logger.error({
				message: error.message,
				service: this.SERVICE_NAME,
				method: "disconnect",
				stack: error.stack,
			});
		}
	};
}

export default MongoDB;
