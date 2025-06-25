import mongoose from "mongoose";
import UserModel from "../models/User.js";
import AppSettings from "../models/AppSettings.js";
import logger from "../../utils/logger.js";

//****************************************
// User Operations
//****************************************

import * as userModule from "./modules/userModule.js";

//****************************************
// Invite Token Operations
//****************************************

import * as inviteModule from "./modules/inviteModule.js";

//****************************************
// Recovery Operations
//****************************************
import * as recoveryModule from "./modules/recoveryModule.js";

//****************************************
//  Monitors
//****************************************

import * as monitorModule from "./modules/monitorModule.js";

//****************************************
// Page Speed Checks
//****************************************

import * as pageSpeedCheckModule from "./modules/pageSpeedCheckModule.js";

//****************************************
// Hardware Checks
//****************************************
import * as hardwareCheckModule from "./modules/hardwareCheckModule.js";

//****************************************
// Checks
//****************************************

import * as checkModule from "./modules/checkModule.js";

//****************************************
// Maintenance Window
//****************************************
import * as maintenanceWindowModule from "./modules/maintenanceWindowModule.js";

//****************************************
// Notifications
//****************************************
import * as notificationModule from "./modules/notificationModule.js";

//****************************************
// AppSettings
//****************************************
import * as settingsModule from "./modules/settingsModule.js";

//****************************************
// Status Page
//****************************************
import * as statusPageModule from "./modules/statusPageModule.js";

//****************************************
// Diagnostic
//****************************************
import * as diagnosticModule from "./modules/diagnosticModule.js";

class MongoDB {
	static SERVICE_NAME = "MongoDB";

	constructor({ appSettings }) {
		this.appSettings = appSettings;
		Object.assign(this, userModule);
		Object.assign(this, inviteModule);
		Object.assign(this, recoveryModule);
		Object.assign(this, monitorModule);
		Object.assign(this, pageSpeedCheckModule);
		Object.assign(this, hardwareCheckModule);
		Object.assign(this, checkModule);
		Object.assign(this, maintenanceWindowModule);
		Object.assign(this, notificationModule);
		Object.assign(this, settingsModule);
		Object.assign(this, statusPageModule);
		Object.assign(this, diagnosticModule);
	}

	connect = async () => {
		try {
			const connectionString =
				this.appSettings.dbConnectionString || "mongodb://localhost:27017/uptime_db";
			await mongoose.connect(connectionString);
			// If there are no AppSettings, create one
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

			logger.info({
				message: "Connected to MongoDB",
				service: this.SERVICE_NAME,
				method: "connect",
			});
		} catch (error) {
			logger.error({
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
			logger.info({ message: "Disconnecting from MongoDB" });
			await mongoose.disconnect();
			logger.info({ message: "Disconnected from MongoDB" });
			return;
		} catch (error) {
			logger.error({
				message: error.message,
				service: this.SERVICE_NAME,
				method: "disconnect",
				stack: error.stack,
			});
		}
	};
	checkSuperadmin = async (req, res) => {
		const superAdmin = await UserModel.findOne({ role: "superadmin" });
		if (superAdmin !== null) {
			return true;
		}
		return false;
	};
}

export default MongoDB;
