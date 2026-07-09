import { ISettingsRepository } from "@/domain/app-settings/app-settings-repository.interface.js";
import { Settings, SettingsUpdate, type ClientRuntimeConfig, type DbType, type QueueMode } from "@/domain/app-settings/app-settings.type.js";
import { AppError } from "@/utils/AppError.js";
import { ValidatedEnv } from "@/config/envValidation.js";
import type { StringValue } from "ms";
const SERVICE_NAME = "SettingsService";

export type EnvConfig = {
	jwtSecret: string;
	jwtTTL: StringValue;
	nodeEnv: string;
	logLevel: string;
	clientHost: string;
	dbConnectionString: string;
	dbType: DbType;
	queueMode: QueueMode;
	queuePrimaryProcesses: boolean;
	statusPageThemesEnabled: boolean;
	clientConfig: ClientRuntimeConfig;
};

export interface ISettingsService {
	readonly serviceName: string;
	loadSettings(): EnvConfig;
	getSettings(): EnvConfig;
	areStatusPageThemesEnabled(): boolean;
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
			dbType: env.DB_TYPE,
			queueMode: env.QUEUE_MODE,
			queuePrimaryProcesses: env.QUEUE_PRIMARY_PROCESSES,
			statusPageThemesEnabled: env.STATUS_PAGE_THEMES_ENABLED,
			clientConfig: {
				...(env.CLIENT_CONFIG_API_BASE_URL && { apiBaseUrl: env.CLIENT_CONFIG_API_BASE_URL }),
				...(env.CLIENT_CONFIG_CLIENT_HOST && { clientHost: env.CLIENT_CONFIG_CLIENT_HOST }),
				...(env.CLIENT_CONFIG_LOG_LEVEL && { logLevel: env.CLIENT_CONFIG_LOG_LEVEL }),
			},
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
		return this.settings;
	}

	areStatusPageThemesEnabled() {
		return this.settings.statusPageThemesEnabled;
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
