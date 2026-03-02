import { ISettingsRepository } from "@/repositories/index.js";
import { Settings } from "@/types/index.js";
import { AppError } from "@/utils/AppError.js";
import { ValidatedEnv } from "@/validation/envValidation.js";

const SERVICE_NAME = "SettingsService";

export type EnvConfig = {
	jwtSecret: string;
	jwtTTL: string;
	nodeEnv: string;
	logLevel: string;
	clientHost: string;
	dbConnectionString: string;
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

	constructor(settingsRepository: ISettingsRepository, env: ValidatedEnv) {
		this.settingsRepository = settingsRepository;
		this.settings = {
			jwtSecret: env.JWT_SECRET,
			jwtTTL: env.TOKEN_TTL,
			nodeEnv: env.NODE_ENV,
			logLevel: env.LOG_LEVEL,
			clientHost: env.CLIENT_HOST,
			dbConnectionString: env.DB_CONNECTION_STRING,
		};
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
