import { connectErrors } from "@/domain/connect/connect.errors.js";
import { IConnectRepository } from "@/domain/connect/connect.repository.interface.js";
import type { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import type { ConnectEnrollment, ConnectState, ConnectStatus } from "@/domain/connect/connect.type.js";
import { IEncryptionService } from "@/service/encryption/encryptionService.js";
import { AppError } from "@/utils/AppError.js";
import { APP_VERSION } from "@/utils/appVersion.js";
import { ILogger } from "@/utils/logger/logger.js";

const SERVICE_NAME = "ConnectService";

export const isConnectHostAllowed = (url: string, allowedHosts: readonly string[]): boolean => {
	try {
		const host = new URL(url.replace(/^wss:/, "https:")).hostname;
		return allowedHosts.some((entry) => (entry.startsWith(".") ? host.endsWith(entry) : host === entry));
	} catch {
		return false;
	}
};

export interface IConnectService {
	getStatus(): Promise<ConnectStatus>;
	enroll(input: ConnectEnrollment): Promise<ConnectStatus>;
	unenroll(): Promise<ConnectStatus>;
}

export class ConnectService implements IConnectService {
	static SERVICE_NAME = SERVICE_NAME;

	constructor(
		private connectRepository: IConnectRepository,
		private encryptionService: IEncryptionService,
		private settingsService: ISettingsService,
		private logger: ILogger
	) {}

	private toStatus = (state: ConnectState): ConnectStatus => {
		return {
			enrolled: state.enrollment !== null,
			agentId: state.enrollment?.agentId ?? null,
			connectUrl: state.enrollment?.connectUrl ?? null,
			apiUrl: state.enrollment?.apiUrl ?? null,
			agentVersion: APP_VERSION,
		};
	};

	getStatus = async (): Promise<ConnectStatus> => {
		const state = await this.connectRepository.get();
		return this.toStatus(state);
	};

	enroll = async (input: ConnectEnrollment): Promise<ConnectStatus> => {
		const { connectAllowedHosts } = this.settingsService.getSettings();
		if (
			!isConnectHostAllowed(input.connectUrl, connectAllowedHosts) ||
			(input.apiUrl !== null && !isConnectHostAllowed(input.apiUrl, connectAllowedHosts))
		) {
			throw new AppError(connectErrors.hostNotAllowed, { service: SERVICE_NAME });
		}
		if (!this.encryptionService.isConfigured()) {
			throw new AppError(connectErrors.encryptionKeyMissing, { service: SERVICE_NAME });
		}
		await this.connectRepository.setEnrollment({ ...input, token: this.encryptionService.encrypt(input.token) });
		const state = await this.connectRepository.get();
		return this.toStatus(state);
	};

	unenroll = async (): Promise<ConnectStatus> => {
		await this.connectRepository.clearEnrollment();
		const state = await this.connectRepository.get();
		return this.toStatus(state);
	};
}
