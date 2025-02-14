const SERVICE_NAME = "SettingsService";
import dotenv from "dotenv";
dotenv.config();
const envConfig = {
	logLevel: process.env.LOG_LEVEL,
	apiBaseUrl: undefined,
	clientHost: process.env.CLIENT_HOST,
	jwtSecret: process.env.JWT_SECRET,
	refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
	dbType: process.env.DB_TYPE,
	dbConnectionString: process.env.DB_CONNECTION_STRING,
	redisHost: process.env.REDIS_HOST,
	redisPort: process.env.REDIS_PORT,
	redisUser: process.env.REDIS_USER,
	redisPassword: process.env.REDIS_PASSWORD,
	redisDb: process.env.REDIS_DB,
	redisPrefix: process.env.REDIS_PREFIX,
	jwtTTL: process.env.TOKEN_TTL,
	refreshTokenTTL: process.env.REFRESH_TOKEN_TTL,
	pagespeedApiKey: process.env.PAGESPEED_API_KEY,
	systemEmailHost: process.env.SYSTEM_EMAIL_HOST,
	systemEmailPort: process.env.SYSTEM_EMAIL_PORT,
	systemEmailAddress: process.env.SYSTEM_EMAIL_ADDRESS,
	systemEmailPassword: process.env.SYSTEM_EMAIL_PASSWORD,
};
/**
 * SettingsService
 *
 * This service is responsible for loading and managing the application settings.
 * It gives priority to environment variables and will only load settings
 * from the database if they are not set in the environment.
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
	 * Load settings from the database and merge with environment settings.
	 * If there are any settings that weren't set by environment variables, use user settings from the database.
	 * @returns {Promise<Object>} The merged settings.
	 * @throws Will throw an error if settings are not found in the database or if settings have not been loaded.
	 */ async loadSettings() {
		try {
			const dbSettings = await this.appSettings.findOne();
			if (!this.settings) {
				throw new Error("Settings not found");
			}

			// If there are any settings that weren't set by environment variables, use user settings from DB
			for (const key in envConfig) {
				if (envConfig[key] === undefined && dbSettings[key] !== undefined) {
					this.settings[key] = dbSettings[key];
				}
			}
			return this.settings;
		} catch (error) {
			error.service === undefined ? (error.service = SERVICE_NAME) : null;
			error.method === undefined ? (error.method = "loadSettings") : null;
			throw error;
		}
	}
	/**
	 * Reload settings by calling loadSettings.
	 * @returns {Promise<Object>} The reloaded settings.
	 */
	async reloadSettings() {
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
}

export default SettingsService;
