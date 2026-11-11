import { connectErrors } from "@/domain/connect/connect.errors.js";
import type { IConnectBackupService } from "@/domain/connect/connect-backup.service.js";
import type { IConnectRepository } from "@/domain/connect/connect.repository.interface.js";
import type { IConnectToolsService } from "@/domain/connect/connect-tools.service.js";
import type { ConnectBackupKind, ConnectBackupResult } from "@/domain/connect/connect-backup.type.js";
import type { ConnectEnrollment } from "@/domain/connect/connect.type.js";
import type { IEncryptionService } from "@/service/encryption/encryptionService.js";
import type { ILogger } from "@/utils/logger/logger.js";

const SERVICE_NAME = "ConnectOperationService";
const TOOLS_HANDOFF_MESSAGE = "mongodump is not installed on this worker; leaving the backup to a worker that has it";
const TOOLS_MISSING_MESSAGE = "mongodump not available on any worker";

export interface IConnectOperationService {
	handleJob(): Promise<void>;
}

export class ConnectOperationService implements IConnectOperationService {
	static SERVICE_NAME = SERVICE_NAME;
	private logger: ILogger;

	constructor(
		private connectRepository: IConnectRepository,
		private encryptionService: IEncryptionService,
		private connectBackupService: IConnectBackupService,
		private connectToolsService: IConnectToolsService,
		logger: ILogger
	) {
		this.logger = logger.child({ service: SERVICE_NAME });
	}

	private failure = (kind: ConnectBackupKind, error: string): ConnectBackupResult => {
		return {
			ok: false,
			at: new Date(),
			kind,
			sizeBytes: null,
			sha256: null,
			backupId: null,
			durationMs: null,
			error,
		};
	};

	private finish = async (result: ConnectBackupResult): Promise<void> => {
		await this.connectRepository.setLastBackup(result);
		await this.connectRepository.clearOperation();
	};

	private decryptSecrets = (enrollment: ConnectEnrollment, recoveryKey: string): { enrollment: ConnectEnrollment; recoveryKey: string } | null => {
		try {
			return {
				enrollment: {
					...enrollment,
					token: this.encryptionService.decrypt(enrollment.token),
				},
				recoveryKey: this.encryptionService.decrypt(recoveryKey),
			};
		} catch (error: unknown) {
			this.logger.warn({ err: error }, "Connect backup skipped: the stored secrets can't be decrypted");
			return null;
		}
	};

	handleJob = async (): Promise<void> => {
		const { enrollment, recoveryKey, operation } = await this.connectRepository.get();
		if (!operation) return;
		if (!enrollment) {
			await this.finish(this.failure(operation.kind, connectErrors.notEnrolled.description));
			return;
		}
		if (!recoveryKey) {
			await this.finish(this.failure(operation.kind, connectErrors.noRecoveryKey.description));
			return;
		}
		if (!this.connectToolsService.hasTool("mongodump")) {
			if (await this.connectToolsService.isAvailableOnAnotherWorker("mongodump")) throw new Error(TOOLS_HANDOFF_MESSAGE);
			await this.finish(this.failure(operation.kind, TOOLS_MISSING_MESSAGE));
			return;
		}
		const secrets = this.decryptSecrets(enrollment, recoveryKey);
		if (!secrets) {
			await this.finish(this.failure(operation.kind, connectErrors.stateUnavailable.description));
			return;
		}

		await this.connectRepository.markOperationStarted(new Date());
		this.logger.info({ kind: operation.kind }, "Connect backup starting");
		const result = await this.connectBackupService.backup({
			...secrets,
			kind: operation.kind,
		});
		await this.finish(result);
	};
}
