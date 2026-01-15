// import AppSettings from "../../models/AppSettings.js";
const SERVICE_NAME = "SettingsModule";

class SettingsModule {
	constructor({ AppSettings }) {
		this.AppSettings = AppSettings;
	}

	updateAppSettings = async (newSettings) => {
		try {
			const update = { $set: { ...newSettings } };

			if (newSettings.pagespeedApiKey === "") {
				update.$unset = { pagespeedApiKey: "" };
				delete update.$set.pagespeedApiKey;
			}

			if (newSettings.systemEmailPassword === "") {
				update.$unset = { systemEmailPassword: "" };
				delete update.$set.systemEmailPassword;
			}

			await this.AppSettings.findOneAndUpdate({}, update, {
				upsert: true,
			});
			const settings = await this.AppSettings.findOne().select("-__v -_id -createdAt -updatedAt -singleton").lean();
			return settings;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "updateAppSettings";
			throw error;
		}
	};
}

export default SettingsModule;
