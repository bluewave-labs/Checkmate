import { connectErrors } from "@/domain/connect/connect.errors.js";
import type { IConnectBackupService } from "@/domain/connect/connect-backup.service.js";
import type { IConnectRepository } from "@/domain/connect/connect.repository.interface.js";
import type { IConnectToolsService } from "@/domain/connect/connect-tools.service.js";
import type {
	ConnectBackupKind,
	ConnectBackupOperation,
	ConnectBackupResult,
	ConnectBackupToolName,
	ConnectKeyCheck,
	ConnectRestoreOperation,
	ConnectVerifyOperation,
	ConnectVerifyOutcome,
} from "@/domain/connect/connect-backup.type.js";
import type { ConnectEnrollment, ConnectState } from "@/domain/connect/connect.type.js";
import type { IEncryptionService } from "@/service/encryption/encryptionService.js";
import type { ILogger } from "@/utils/logger/logger.js";

const SERVICE_NAME = "ConnectOperationService";
const toolsHandoffMessage = (tool: ConnectBackupToolName) => `${tool} is not installed on this worker; leaving the operation to a worker that has it`;
const toolsMissingMessage = (tool: ConnectBackupToolName) => `${tool} not available on any worker`;

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

	private failure = (kind: ConnectBackupKind | null, error: string, backupId: string | null = null): ConnectBackupResult => {
		return { ok: false, at: new Date(), kind, sizeBytes: null, sha256: null, backupId, durationMs: null, error };
	};

	private finishBackup = async (result: ConnectBackupResult): Promise<void> => {
		await this.connectRepository.setLastBackup(result);
		await this.connectRepository.clearOperation();
	};

	private finishVerify = async (outcome: ConnectVerifyOutcome, error: string | null): Promise<void> => {
		await this.connectRepository.setLastVerify({ outcome, at: new Date(), error });
		await this.connectRepository.clearOperation();
	};

	private ensureTool = async (tool: ConnectBackupToolName): Promise<boolean> => {
		if (this.connectToolsService.hasTool(tool)) return true;
		if (await this.connectToolsService.isAvailableOnAnotherWorker(tool)) throw new Error(toolsHandoffMessage(tool));
		return false;
	};

	private finishRestore = async (result: ConnectBackupResult): Promise<void> => {
		await this.connectRepository.setLastRestore(result);
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

	private runBackup = async ({ enrollment, recoveryKey }: ConnectState, operation: ConnectBackupOperation): Promise<void> => {
		if (!enrollment) return this.finishBackup(this.failure(operation.kind, connectErrors.notEnrolled.description));
		if (!recoveryKey) return this.finishBackup(this.failure(operation.kind, connectErrors.noRecoveryKey.description));
		if (!(await this.ensureTool("mongodump"))) return this.finishBackup(this.failure(operation.kind, toolsMissingMessage("mongodump")));
		const secrets = this.decryptSecrets(enrollment, recoveryKey);
		if (!secrets) return this.finishBackup(this.failure(operation.kind, connectErrors.stateUnavailable.description));

		await this.connectRepository.markOperationStarted(new Date());
		this.logger.info({ kind: operation.kind }, "Connect backup starting");
		const result = await this.connectBackupService.backup({ ...secrets, kind: operation.kind });
		await this.finishBackup(result);
	};

	private runRestore = async ({ enrollment, recoveryKey }: ConnectState, operation: ConnectRestoreOperation): Promise<void> => {
		const { backupId } = operation;
		if (!enrollment) return this.finishRestore(this.failure(null, connectErrors.notEnrolled.description, backupId));
		if (!recoveryKey) return this.finishRestore(this.failure(null, connectErrors.restoreNeedsRecoveryKey.description, backupId));
		if (!(await this.ensureTool("mongorestore"))) return this.finishRestore(this.failure(null, toolsMissingMessage("mongorestore"), backupId));
		const secrets = this.decryptSecrets(enrollment, recoveryKey);
		if (!secrets) return this.finishRestore(this.failure(null, connectErrors.stateUnavailable.description, backupId));

		await this.connectRepository.markOperationStarted(new Date());
		this.logger.info({ backupId }, "Connect restore starting");
		const result = await this.connectBackupService.restore({ ...secrets, backupId });
		await this.finishRestore(result);
	};

	private runVerify = async ({ enrollment }: ConnectState, operation: ConnectVerifyOperation): Promise<void> => {
		if (!enrollment) return this.finishVerify("failed", connectErrors.notEnrolled.description);
		const secrets = this.decryptSecrets(enrollment, operation.recoveryKey);
		if (!secrets) return this.finishVerify("failed", connectErrors.stateUnavailable.description);

		await this.connectRepository.markOperationStarted(new Date());
		this.logger.info("Connect recovery key check starting");
		let outcome: ConnectKeyCheck;
		try {
			outcome = await this.connectBackupService.verify(secrets);
		} catch (error: unknown) {
			this.logger.warn({ err: error }, "Connect recovery key check failed");
			return this.finishVerify("failed", error instanceof Error ? error.message : "unknown error");
		}
		if (outcome !== "ok") return this.finishVerify(outcome, null);
		if (operation.replaceExisting) {
			await this.connectRepository.replaceRecoveryKey(operation.recoveryKey);
			return this.finishVerify("ok", null);
		}
		const saved = await this.connectRepository.setRecoveryKeyIfUnset(operation.recoveryKey);
		if (!saved) return this.finishVerify("failed", connectErrors.recoveryKeyAlreadySet.description);
		return this.finishVerify("ok", null);
	};

	handleJob = async (): Promise<void> => {
		const state = await this.connectRepository.get();
		const { operation } = state;
		if (!operation) return;
		if (operation.type === "backup") return this.runBackup(state, operation);
		if (operation.type === "restore") return this.runRestore(state, operation);
		return this.runVerify(state, operation);
	};
}
