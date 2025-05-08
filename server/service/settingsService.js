const SERVICE_NAME = "SettingsService";
const envConfig = {
	logLevel: process.env.LOG_LEVEL,
	clientHost: process.env.CLIENT_HOST,
	jwtSecret: process.env.JWT_SECRET,
	dbType: process.env.DB_TYPE,
	dbConnectionString: process.env.DB_CONNECTION_STRING,
	redisUrl: process.env.REDIS_URL,
	jwtTTL: process.env.TOKEN_TTL,
	pagespeedApiKey: process.env.PAGESPEED_API_KEY,
	systemEmailHost: process.env.SYSTEM_EMAIL_HOST,
	systemEmailPort: process.env.SYSTEM_EMAIL_PORT,
	systemEmailUser: process.env.SYSTEM_EMAIL_USER,
	systemEmailAddress: process.env.SYSTEM_EMAIL_ADDRESS,
	systemEmailPassword: process.env.SYSTEM_EMAIL_PASSWORD,
};
/**
 * SettingsService
 *
 * This service is responsible for loading and managing the application settings.
 */
class SettingsService {
	static SERVICE_NAME = SERVICE_NAME;
	/**
	 * Constructs a new SettingsService
	 * @constructor
	 * @throws {Error}
	 */ constructor(appSettings) {
		this.appSettings = appSettings;
		this.settings = { ...envConfig };
	}
	/**
	 * Load settings from env settings
	 * @returns {Object>} The settings.
	 */
	loadSettings() {
		return this.settings;
	}
	/**
	 * Reload settings by calling loadSettings.
	 * @returns {Promise<Object>} The reloaded settings.
	 */
	reloadSettings() {
		return this.loadSettings();
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
		const settings = await this.appSettings.findOne({ singleton: true }).lean();
		return settings;
	}
}

export default SettingsService;
