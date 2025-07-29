const SERVICE_NAME = "SettingsService";

const envConfig = {
	jwtSecret: process.env.JWT_SECRET,
	jwtTTL: process.env.TOKEN_TTL,
	systemEmailHost: process.env.SYSTEM_EMAIL_HOST,
	nodeEnv: process.env.NODE_ENV,
	logLevel: process.env.LOG_LEVEL,
	clientHost: process.env.CLIENT_HOST,
	dbConnectionString: process.env.DB_CONNECTION_STRING,
	port: process.env.PORT,
};
/**
 * SettingsService
 *
 * This service is responsible for loading and managing the application settings.
 */
class SettingsService {
	static SERVICE_NAME = "SettingsService";

	/**
	 * Constructs a new SettingsService
	 * @constructor
	 * @throws {Error}
	 */ constructor(AppSettings) {
		this.AppSettings = AppSettings;
		this.settings = { ...envConfig };
	}

	get serviceName() {
		return SettingsService.SERVICE_NAME;
	}

	/**
	 * Load settings from env settings
	 * @returns {Object>} The settings.
	 */
	loadSettings() {
		return this.settings;
	}

	/**
	 * Get the current settings.
	 * @returns {Object} The current settings.
	 * @throws Will throw an error if settings have not been loaded.
	 */
	getSettings() {
		if (!this.settings) {
			throw new Error("Settings have not been loaded");
		}
		return this.settings;
	}

	async getDBSettings() {
		// Remove any old settings
		await this.AppSettings.deleteMany({ version: { $exists: false } });

		let settings = await this.AppSettings.findOne({ singleton: true }).select("-__v -_id -createdAt -updatedAt -singleton").lean();
		if (settings === null) {
			await this.AppSettings.create({});
			settings = await this.AppSettings.findOne({ singleton: true }).select("-__v -_id -createdAt -updatedAt -singleton").lean();
		}
		return settings;
	}
}

export default SettingsService;
