import { ISettingsRepository } from "@/repositories/index.js";
import { Settings } from "@/types/index.js";
import { AppError } from "@/utils/AppError.js";

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
	getDBSettings(): Promise<Settings>;
}

class SettingsService implements ISettingsService {
	static SERVICE_NAME = "SettingsService";
	private settings: EnvConfig;
	private settingsRepository: ISettingsRepository;

	constructor(settingsRepository: ISettingsRepository) {
		this.settingsRepository = settingsRepository;
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

	updateDbSettings = async (newSettings: Partial<Settings>) => {
		return await this.settingsRepository.update(newSettings);
	};

	getDBSettings = async () => {
		// Remove any old settings
		await this.settingsRepository.deleteLegacy();

		let settings = await this.settingsRepository.findSingleton();
		if (settings === null) {
			await this.settingsRepository.create({});
			settings = await this.settingsRepository.findSingleton();
		}

		if (!settings) {
			throw new AppError({ message: "Settings not found", status: 500 });
		}

		return settings;
	};
}

export default SettingsService;
