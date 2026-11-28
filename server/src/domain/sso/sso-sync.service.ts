import { ConnectApiRejectedError, type IConnectApiService } from "@/domain/connect/connect-api.service.js";
import type { IConnectRepository } from "@/domain/connect/connect.repository.interface.js";
import type { ConnectSsoConfig } from "@/domain/connect/connect.type.js";
import type { IEncryptionService } from "@/service/encryption/encryptionService.js";
import type { ILogger } from "@/utils/logger/logger.js";

const SERVICE_NAME = "SsoSyncService";

type SsoSyncOutcome = "synced" | "disabled" | "unreachable" | "unreadable";

const DISABLED_CONFIG: ConnectSsoConfig = { enabled: false, provider: null, label: null, enforce: false, graceUntil: null, startUrl: null };

export interface SsoSyncServiceDependencies {
	connectRepository: IConnectRepository;
	connectApiService: IConnectApiService;
	encryptionService: IEncryptionService;
	logger: ILogger;
	now?: () => Date;
}

export interface ISsoSyncService {
	handleJob(): Promise<void>;
}

export class SsoSyncService implements ISsoSyncService {
	static SERVICE_NAME = SERVICE_NAME;
	private logger: ILogger;
	private lastOutcome: SsoSyncOutcome | null = null;
	private connectRepository: IConnectRepository;
	private connectApiService: IConnectApiService;
	private encryptionService: IEncryptionService;
	private now: () => Date;

	constructor(dependencies: SsoSyncServiceDependencies) {
		this.connectRepository = dependencies.connectRepository;
		this.connectApiService = dependencies.connectApiService;
		this.encryptionService = dependencies.encryptionService;
		this.now = dependencies.now ?? (() => new Date());
		this.logger = dependencies.logger.child({ service: SERVICE_NAME });
	}

	private report = (outcome: SsoSyncOutcome, log: () => void) => {
		if (outcome !== this.lastOutcome) log();
		this.lastOutcome = outcome;
	};

	handleJob = async (): Promise<void> => {
		try {
			const { enrollment, sso } = await this.connectRepository.get();
			if (!enrollment) {
				this.lastOutcome = null;
				if (sso !== null) await this.connectRepository.setSsoState(null);
				return;
			}

			let token: string;
			try {
				token = this.encryptionService.decrypt(enrollment.token);
			} catch (error: unknown) {
				this.report("unreadable", () => this.logger.warn({ err: error }, "SSO sync paused: the stored credential can't be decrypted"));
				return;
			}

			let config: ConnectSsoConfig;
			try {
				config = await this.connectApiService.ssoConfig({ ...enrollment, token });
			} catch (error: unknown) {
				if (error instanceof ConnectApiRejectedError && error.status === 401) {
					await this.connectRepository.setSsoState({
						...DISABLED_CONFIG,
						fetchedAt: this.now().toISOString(),
						lastCheckRunAt: sso?.lastCheckRunAt ?? null,
					});
					this.report("disabled", () => this.logger.warn("SSO disabled: Connect rejected this installation's credentials"));
					return;
				}
				// Network failure, 503 unavailable or an unexpected body: keep the cached config
				this.report("unreachable", () => this.logger.warn({ err: error }, "SSO sync can't reach Connect, keeping the cached config"));
				return;
			}

			await this.connectRepository.setSsoState({ ...config, fetchedAt: this.now().toISOString(), lastCheckRunAt: sso?.lastCheckRunAt ?? null });
			this.report("synced", () => this.logger.info({ enabled: config.enabled }, "SSO config synced from Connect"));
		} catch (error: unknown) {
			this.logger.warn({ err: error }, "SSO sync failed");
		}
	};
}
