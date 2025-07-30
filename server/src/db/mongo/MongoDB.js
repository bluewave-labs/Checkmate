import mongoose from "mongoose";
import AppSettings from "../models/AppSettings.js";

//****************************************
// Recovery Operations
//****************************************
import * as recoveryModule from "./modules/recoveryModule.js";

//****************************************
// Page Speed Checks
//****************************************

import * as pageSpeedCheckModule from "./modules/pageSpeedCheckModule.js";

//****************************************
// Notifications
//****************************************
import * as notificationModule from "./modules/notificationModule.js";

//****************************************
// AppSettings
//****************************************
import * as settingsModule from "./modules/settingsModule.js";

//****************************************
// Diagnostic
//****************************************
import * as diagnosticModule from "./modules/diagnosticModule.js";

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
	}) {
		this.logger = logger;
		this.envSettings = envSettings;
		this.userModule = userModule;
		this.inviteModule = inviteModule;
		Object.assign(this, recoveryModule);
		Object.assign(this, monitorModule);
		Object.assign(this, pageSpeedCheckModule);
		this.hardwareCheckModule = hardwareCheckModule;
		this.checkModule = checkModule;
		this.maintenanceWindowModule = maintenanceWindowModule;
		this.monitorModule = monitorModule;
		Object.assign(this, notificationModule);
		Object.assign(this, settingsModule);
		this.statusPageModule = statusPageModule;
		Object.assign(this, diagnosticModule);
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
