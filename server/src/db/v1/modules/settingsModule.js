// import AppSettings from "../../models/AppSettings.js";
const SERVICE_NAME = "SettingsModule";

class SettingsModule {
	constructor({ AppSettings }) {
		this.AppSettings = AppSettings;
		this.settingsCache = null;
		this.cacheTimestamp = null;
		this.CACHE_TTL = 60000; // 1 minute cache
	}

	getAppSettings = async () => {
		try {
			const now = Date.now();
			if (this.settingsCache && this.cacheTimestamp && (now - this.cacheTimestamp) < this.CACHE_TTL) {
				return this.settingsCache;
			}

			const settings = await this.AppSettings.findOne({ singleton: true }).select("-__v -_id -createdAt -updatedAt -singleton").lean();
			this.settingsCache = settings;
			this.cacheTimestamp = now;
			return settings;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getAppSettings";
			throw error;
		}
	};

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
			
			// Invalidate cache after update
			this.settingsCache = settings;
			this.cacheTimestamp = Date.now();
			
			return settings;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "updateAppSettings";
			throw error;
		}
	};
}

export default SettingsModule;
