import type { ConnectBackupResult, ConnectOperationRequest, ConnectProgress, ConnectVerifyResult } from "@/domain/connect/connect-backup.type.js";
import type { ConnectEnrollment, ConnectState } from "@/domain/connect/connect.type.js";

export interface IConnectRepository {
	// create
	setEnrollment(enrollment: ConnectEnrollment): Promise<void>;
	// fetch
	get(): Promise<ConnectState>;
	// update
	setSecrets(secrets: { token?: string; recoveryKey?: string }): Promise<void>;
	setRemoteAccess(enabled: boolean): Promise<void>;
	clearEnrollment(): Promise<void>;
	setRecoveryKeyIfUnset(recoveryKey: string): Promise<boolean>;
	requestOperation(operation: ConnectOperationRequest): Promise<boolean>;
	markOperationStarted(at: Date): Promise<void>;
	setProgress(progress: ConnectProgress): Promise<void>;
	setLastBackup(result: ConnectBackupResult): Promise<void>;
	setLastRestore(result: ConnectBackupResult): Promise<void>;
	setLastVerify(result: ConnectVerifyResult): Promise<void>;
	replaceRecoveryKey(recoveryKey: string): Promise<void>;
	clearOperation(): Promise<void>;
	// delete
}
