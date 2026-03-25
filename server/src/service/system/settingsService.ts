import { ISettingsRepository } from "@/repositories/index.js";
import { Settings, SettingsUpdate } from "@/types/index.js";
import { AppError } from "@/utils/AppError.js";
import { ValidatedEnv } from "@/validation/envValidation.js";
import type { StringValue } from "ms";
const SERVICE_NAME = "SettingsService";

export type EnvConfig = {
	jwtSecret: string;
	jwtTTL: StringValue;
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
	updateDbSettings(newSettings: SettingsUpdate): Promise<Settings>;
}

export class SettingsService implements ISettingsService {
	static SERVICE_NAME = SERVICE_NAME;
	private settings: EnvConfig;
	private settingsRepository: ISettingsRepository | null = null;

	constructor(env: ValidatedEnv) {
		this.settings = {
			jwtSecret: env.JWT_SECRET,
			jwtTTL: env.TOKEN_TTL as StringValue,
			nodeEnv: env.NODE_ENV,
			logLevel: env.LOG_LEVEL,
			clientHost: env.CLIENT_HOST,
			dbConnectionString: env.DB_CONNECTION_STRING,
		};
	}

	setRepository(settingsRepository: ISettingsRepository) {
		this.settingsRepository = settingsRepository;
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

	private getRepository(): ISettingsRepository {
		if (!this.settingsRepository) {
			throw new AppError({
				message: "Settings repository not initialized. Call setRepository() after DB connect.",
				status: 500,
				service: SERVICE_NAME,
			});
		}
		return this.settingsRepository;
	}

	updateDbSettings = async (newSettings: SettingsUpdate) => {
		return await this.getRepository().update(newSettings);
	};

	getDBSettings = async () => {
		const repo = this.getRepository();
		// Remove any old settings
		await repo.deleteLegacy();

		let settings = await repo.findSingleton();
		if (settings === null) {
			await repo.create({});
			settings = await repo.findSingleton();
		}

		if (!settings) {
			throw new AppError({ message: "Settings not found", status: 500 });
		}

		return settings;
	};
}
