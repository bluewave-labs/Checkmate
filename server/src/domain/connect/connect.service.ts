import { connectErrors } from "@/domain/connect/connect.errors.js";
import { IConnectRepository } from "@/domain/connect/connect.repository.interface.js";
import type { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import type { ConnectEnrollment, ConnectState, ConnectStatus } from "@/domain/connect/connect.type.js";
import { IEncryptionService } from "@/service/encryption/encryptionService.js";
import { AppError } from "@/utils/AppError.js";
import { APP_VERSION } from "@/utils/appVersion.js";
import { ILogger } from "@/utils/logger/logger.js";
import { IConnectTunnel } from "@/domain/connect/connect-tunnel.js";

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
	start(): Promise<void>;
	stop(): void;
	getStatus(): Promise<ConnectStatus>;
	enroll(input: ConnectEnrollment): Promise<ConnectStatus>;
	unenroll(): Promise<ConnectStatus>;
	setRemoteAccess(enabled: boolean): Promise<ConnectStatus>;
}

export class ConnectService implements IConnectService {
	static SERVICE_NAME = SERVICE_NAME;
	private logger: ILogger;

	constructor(
		private connectRepository: IConnectRepository,
		private encryptionService: IEncryptionService,
		private settingsService: ISettingsService,
		private tunnel: IConnectTunnel,
		logger: ILogger
	) {
		this.logger = logger.child({ service: SERVICE_NAME });
	}

	private toStatus = (state: ConnectState): ConnectStatus => {
		return {
			enrolled: state.enrollment !== null,
			agentId: state.enrollment?.agentId ?? null,
			connectUrl: state.enrollment?.connectUrl ?? null,
			apiUrl: state.enrollment?.apiUrl ?? null,
			agentVersion: APP_VERSION,
			remoteAccess: { enabled: state.remoteAccessEnabled },
			tunnel: this.tunnel.status(),
		};
	};

	private decrypt = (value: string): string => {
		try {
			return this.encryptionService.decrypt(value);
		} catch {
			throw new AppError(connectErrors.stateUnavailable, { service: SERVICE_NAME });
		}
	};

	private applyTunnel = (state: ConnectState) => {
		const { enrollment, remoteAccessEnabled } = state;
		if (!enrollment || !remoteAccessEnabled) {
			this.tunnel.stop();
			return;
		}
		this.tunnel.start({ ...enrollment, token: this.decrypt(enrollment.token) });
	};

	start = async (): Promise<void> => {
		try {
			const state = await this.connectRepository.get();
			this.applyTunnel(state);
		} catch (error: unknown) {
			this.logger.error({ err: error }, "Connect could not start remote access");
		}
	};

	stop = () => {
		this.tunnel.stop();
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
		this.applyTunnel(state);
		return this.toStatus(state);
	};

	unenroll = async (): Promise<ConnectStatus> => {
		await this.connectRepository.clearEnrollment();
		const state = await this.connectRepository.get();
		this.applyTunnel(state);
		return this.toStatus(state);
	};

	setRemoteAccess = async (enabled: boolean): Promise<ConnectStatus> => {
		const current = await this.connectRepository.get();
		if (enabled) {
			if (!current.enrollment) throw new AppError(connectErrors.notEnrolled, { service: SERVICE_NAME });
			this.decrypt(current.enrollment.token);
		}
		await this.connectRepository.setRemoteAccess(enabled);
		const state = { ...current, remoteAccessEnabled: enabled };
		this.applyTunnel(state);
		return this.toStatus(state);
	};
}
