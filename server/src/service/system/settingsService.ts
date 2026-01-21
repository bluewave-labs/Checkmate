const SERVICE_NAME = "SettingsService";

export type EnvConfig = {
	jwtSecret: string | undefined;
	jwtTTL: string | undefined;
	systemEmailHost: string | undefined;
	nodeEnv: string | undefined;
	logLevel: string | undefined;
	clientHost: string | undefined;
	dbConnectionString: string | undefined;
	port: string | undefined;
};

const envConfig: EnvConfig = {
	jwtSecret: process.env.JWT_SECRET,
	jwtTTL: process.env.TOKEN_TTL,
	systemEmailHost: process.env.SYSTEM_EMAIL_HOST,
	nodeEnv: process.env.NODE_ENV,
	logLevel: process.env.LOG_LEVEL,
	clientHost: process.env.CLIENT_HOST,
	dbConnectionString: process.env.DB_CONNECTION_STRING,
	port: process.env.PORT,
};

export interface ISettingsService {
	readonly serviceName: string;
	loadSettings(): EnvConfig;
	getSettings(): EnvConfig;
	getDBSettings(): Promise<Record<string, any>>;
}

class SettingsService implements ISettingsService {
	static SERVICE_NAME = "SettingsService";
	private AppSettings: any;
	private settings: EnvConfig;

	constructor(AppSettings: any) {
		this.AppSettings = AppSettings;
		this.settings = { ...envConfig };
	}

	get serviceName() {
		return SettingsService.SERVICE_NAME;
	}

	loadSettings() {
		return this.settings;
	}

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
