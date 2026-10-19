import type { Got } from "got";
import type { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import type { ISettingsRepository } from "@/domain/app-settings/app-settings-repository.interface.js";
import type { TelemetryPayload } from "@/domain/telemetry/telemetry.type.js";
import type { ILogger } from "@/utils/logger/logger.js";
import { timeRequest } from "@/service/networkProviders/utils.js";
import { APP_VERSION } from "@/utils/appVersion.js";

const SERVICE_NAME = "TelemetryService";
const TIMEOUT_MS = 5000;

export interface ITelemetryService {
	buildPayload(): Promise<TelemetryPayload | null>;
	handleJob(): Promise<void>;
}

export class TelemetryService implements ITelemetryService {
	static SERVICE_NAME = SERVICE_NAME;
	private logger: ILogger;

	constructor(
		private got: Got,
		private settingsService: ISettingsService,
		private settingsRepository: ISettingsRepository,
		logger: ILogger
	) {
		this.logger = logger.child({ service: SERVICE_NAME });
	}

	buildPayload = async (): Promise<TelemetryPayload | null> => {
		const instanceId = await this.settingsRepository.findOrCreateTelemetryInstanceId();
		if (!instanceId) return null;
		const { queueMode, deployment } = this.settingsService.getSettings();
		return {
			instanceId,
			version: APP_VERSION,
			deployment,
			queueMode,
			nodeVersion: process.versions.node,
			os: process.platform,
			arch: process.arch,
		};
	};

	handleJob = async () => {
		const { telemetryEnabled, telemetryUrl } = this.settingsService.getSettings();
		if (!telemetryEnabled) return;
		try {
			const payload = await this.buildPayload();
			if (!payload) return;
			let timer: NodeJS.Timeout | undefined;
			const { error } = await timeRequest(() =>
				Promise.race([
					this.got.post(telemetryUrl, {
						json: payload,
						headers: { "user-agent": `Checkmate/${APP_VERSION}` },
						retry: { limit: 0 },
					}),
					new Promise<never>((_, reject) => {
						timer = setTimeout(() => reject(new Error(`Telemetry timed out after ${TIMEOUT_MS}ms`)), TIMEOUT_MS);
					}),
				]).finally(() => clearTimeout(timer))
			);
			if (error) this.logger.debug({ err: error }, "Telemetry heartbeat failed");
		} catch (error: unknown) {
			this.logger.debug({ err: error }, "Telemetry heartbeat failed");
		}
	};
}
