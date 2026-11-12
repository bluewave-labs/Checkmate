import crypto from "node:crypto";
import { connectErrors } from "@/domain/connect/connect.errors.js";
import type { IConnectRepository } from "@/domain/connect/connect.repository.interface.js";
import type { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import type { ConnectEnrollment, ConnectState, ConnectStatus } from "@/domain/connect/connect.type.js";
import type { IEncryptionService } from "@/service/encryption/encryptionService.js";
import { AppError } from "@/utils/AppError.js";
import { APP_VERSION } from "@/utils/appVersion.js";
import type { ILogger } from "@/utils/logger/logger.js";
import type { IConnectTunnel } from "@/domain/connect/connect-tunnel.js";
import {
	CONNECT_RECOVERY_KEY_FORMAT,
	ConnectBackupToolNames,
	type ConnectApiBackup,
	type ConnectOperationRequest,
	type ConnectBackupKind,
	type ConnectBackupList,
	type ConnectBackupResult,
	type ConnectBackupStatus,
	type ConnectBackupToolName,
	type ConnectQueued,
	type ConnectRecoveryKey,
} from "@/domain/connect/connect-backup.type.js";
import type { IConnectApiService } from "@/domain/connect/connect-api.service.js";
import type { IQueueWorkersRepository } from "@/domain/queue-workers/queue-worker.repository.interface.js";
import type { IJobScheduler } from "@/worker/worker.interface.js";
import { WORKER_STALE_MS } from "@/domain/queue-workers/queue-worker.model.js";
import { recoveryKeyId } from "@/domain/connect/connect.backup-format.js";

const SERVICE_NAME = "ConnectService";
const RECOVERY_KEY_BYTES = 32;

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
	getBackupStatus(): Promise<ConnectBackupStatus>;
	listBackups(): Promise<ConnectBackupList>;
	createRecoveryKey(discardExisting: boolean): Promise<ConnectRecoveryKey>;
	runBackup(kind: ConnectBackupKind): Promise<ConnectQueued>;
	importRecoveryKey(recoveryKey: string, replaceExisting: boolean): Promise<ConnectQueued>;
	restoreBackup(backupId: string): Promise<ConnectQueued>;
}

export class ConnectService implements IConnectService {
	static SERVICE_NAME = SERVICE_NAME;
	private logger: ILogger;

	constructor(
		private connectRepository: IConnectRepository,
		private encryptionService: IEncryptionService,
		private settingsService: ISettingsService,
		private tunnel: IConnectTunnel,
		private connectApiService: IConnectApiService,
		private queueWorkersRepository: IQueueWorkersRepository,
		private scheduler: IJobScheduler,
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
			backup: { recoveryKeySet: state.recoveryKey !== null },
		};
	};

	private decrypt = (value: string): string => {
		try {
			return this.encryptionService.decrypt(value);
		} catch {
			throw new AppError(connectErrors.stateUnavailable, { service: SERVICE_NAME });
		}
	};

	private toResultStatus = (result: ConnectBackupResult): NonNullable<ConnectBackupStatus["lastBackup"]> => {
		return { ...result, at: result.at.toISOString() };
	};

	private requireEnrollment = (state: ConnectState): ConnectEnrollment => {
		if (!state.enrollment) throw new AppError(connectErrors.notEnrolled, { service: SERVICE_NAME });
		return state.enrollment;
	};

	private requireEncryption = (): void => {
		if (!this.encryptionService.isConfigured()) throw new AppError(connectErrors.encryptionKeyMissing, { service: SERVICE_NAME });
	};

	private fetchCloudBackups = async (enrollment: ConnectEnrollment): Promise<ConnectApiBackup[]> => {
		const token = this.decrypt(enrollment.token);
		try {
			return await this.connectApiService.list({ ...enrollment, token });
		} catch (error: unknown) {
			throw new AppError(connectErrors.connectUnreachable, {
				service: SERVICE_NAME,
				...(error instanceof Error && { message: error.message }),
			});
		}
	};

	private assertNoCloudBackups = async (enrollment: ConnectEnrollment): Promise<void> => {
		const backups = await this.fetchCloudBackups(enrollment);
		if (backups.length > 0) throw new AppError(connectErrors.cloudBackupsExist, { service: SERVICE_NAME });
	};

	private missingTools = async (): Promise<ConnectBackupToolName[]> => {
		const workers = await this.queueWorkersRepository.findRecent(WORKER_STALE_MS);
		const reports = workers.flatMap((worker) => (worker.processesJobs && worker.connectTools ? [worker.connectTools.missing] : []));
		if (reports.length === 0) return [];
		return ConnectBackupToolNames.filter((tool) => reports.every((missing) => missing.includes(tool)));
	};

	private resumeOperation = async (state: ConnectState): Promise<void> => {
		if (!state.operation) return;
		try {
			await this.scheduler.addGlobalJob("connect-operation");
		} catch (error: unknown) {
			this.logger.error({ err: error }, "Connect could not re-queue its pending operation");
		}
	};

	private queueOperation = async (operation: ConnectOperationRequest): Promise<ConnectQueued> => {
		const requested = await this.connectRepository.requestOperation(operation);
		if (!requested) throw new AppError(connectErrors.busy, { service: SERVICE_NAME });
		await this.scheduler.addGlobalJob("connect-operation");
		return { queued: true };
	};

	start = async (): Promise<void> => {
		try {
			const state = await this.connectRepository.get();
			await this.resumeOperation(state);
			const { enrollment, remoteAccessEnabled } = state;
			if (!enrollment || !remoteAccessEnabled) return;
			this.tunnel.start({ ...enrollment, token: this.decrypt(enrollment.token) });
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
		this.requireEncryption();
		await this.connectRepository.setEnrollment({ ...input, token: this.encryptionService.encrypt(input.token) });
		const state = await this.connectRepository.get();
		if (!state.remoteAccessEnabled) {
			this.tunnel.stop();
			return this.toStatus(state);
		}
		this.tunnel.start(input);
		return this.toStatus(state);
	};

	unenroll = async (): Promise<ConnectStatus> => {
		await this.connectRepository.clearEnrollment();
		const state = await this.connectRepository.get();
		this.tunnel.stop();
		return this.toStatus(state);
	};

	setRemoteAccess = async (enabled: boolean): Promise<ConnectStatus> => {
		const current = await this.connectRepository.get();
		if (!enabled) {
			await this.connectRepository.setRemoteAccess(false);
			this.tunnel.stop();
			return this.toStatus({ ...current, remoteAccessEnabled: false });
		}

		const enrollment = this.requireEnrollment(current);
		const token = this.decrypt(enrollment.token);
		await this.connectRepository.setRemoteAccess(true);
		this.tunnel.start({ ...enrollment, token });
		return this.toStatus({ ...current, remoteAccessEnabled: true });
	};

	getBackupStatus = async (): Promise<ConnectBackupStatus> => {
		const [state, running, missingTools] = await Promise.all([
			this.connectRepository.get(),
			this.scheduler.isGlobalJobRunning("connect-operation"),
			this.missingTools(),
		]);
		const { operation, progress, lastBackup, lastRestore, lastVerify } = state;
		return {
			operation: operation
				? {
						type: operation.type,
						state: operation.startedAt && running ? "running" : "queued",
						requestedAt: operation.requestedAt.toISOString(),
					}
				: null,
			progress: running ? progress : null,
			lastBackup: lastBackup ? this.toResultStatus(lastBackup) : null,
			lastRestore: lastRestore ? this.toResultStatus(lastRestore) : null,
			lastVerify: lastVerify ? { ...lastVerify, at: lastVerify.at.toISOString() } : null,
			missingTools,
		};
	};

	listBackups = async (): Promise<ConnectBackupList> => {
		const state = await this.connectRepository.get();
		const enrollment = this.requireEnrollment(state);
		const backups = await this.fetchCloudBackups(enrollment);
		const keyId = state.recoveryKey ? recoveryKeyId(this.decrypt(state.recoveryKey)) : null;
		return {
			backups: backups.map((backup) => ({
				id: backup.id,
				kind: backup.kind,
				sizeBytes: backup.sizeBytes,
				status: backup.status,
				createdAt: backup.createdAt,
				keyId: backup.keyId ?? null,
				expiresAt: backup.expiresAt ?? null,
				restorable: !backup.keyId || backup.keyId === keyId,
			})),
		};
	};

	createRecoveryKey = async (discardExisting: boolean): Promise<ConnectRecoveryKey> => {
		const state = await this.connectRepository.get();
		const enrollment = this.requireEnrollment(state);
		if (state.recoveryKey)
			throw new AppError(connectErrors.recoveryKeyAlreadySet, {
				service: SERVICE_NAME,
			});
		this.requireEncryption();
		if (!discardExisting) await this.assertNoCloudBackups(enrollment);

		const recoveryKey = crypto.randomBytes(RECOVERY_KEY_BYTES).toString("hex");
		const saved = await this.connectRepository.setRecoveryKeyIfUnset(this.encryptionService.encrypt(recoveryKey));
		if (!saved)
			throw new AppError(connectErrors.recoveryKeyAlreadySet, {
				service: SERVICE_NAME,
			});
		return { recoveryKey, format: CONNECT_RECOVERY_KEY_FORMAT };
	};

	runBackup = async (kind: ConnectBackupKind): Promise<ConnectQueued> => {
		const state = await this.connectRepository.get();
		this.requireEnrollment(state);
		if (!state.recoveryKey) throw new AppError(connectErrors.noRecoveryKey, { service: SERVICE_NAME });
		return this.queueOperation({
			type: "backup",
			kind,
			requestedAt: new Date(),
			startedAt: null,
		});
	};

	importRecoveryKey = async (recoveryKey: string, replaceExisting: boolean): Promise<ConnectQueued> => {
		const state = await this.connectRepository.get();
		this.requireEnrollment(state);
		if (state.recoveryKey && !replaceExisting)
			throw new AppError(connectErrors.recoveryKeyAlreadySet, {
				service: SERVICE_NAME,
			});
		if (state.recoveryKey && this.decrypt(state.recoveryKey) === recoveryKey)
			throw new AppError(connectErrors.sameRecoveryKey, {
				service: SERVICE_NAME,
			});
		this.requireEncryption();
		return this.queueOperation({
			type: "verify",
			recoveryKey: this.encryptionService.encrypt(recoveryKey),
			replaceExisting,
			requestedAt: new Date(),
			startedAt: null,
		});
	};

	restoreBackup = async (backupId: string): Promise<ConnectQueued> => {
		const state = await this.connectRepository.get();
		this.requireEnrollment(state);
		if (!state.recoveryKey)
			throw new AppError(connectErrors.restoreNeedsRecoveryKey, {
				service: SERVICE_NAME,
			});
		return this.queueOperation({
			type: "restore",
			backupId,
			requestedAt: new Date(),
			startedAt: null,
		});
	};
}
