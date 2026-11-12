import type { IConnectRepository } from "../../src/domain/connect/connect.repository.interface.ts";
import type { ConnectEnrollment, ConnectState } from "../../src/domain/connect/connect.type.ts";
import type {
	ConnectBackupResult,
	ConnectOperationRequest,
	ConnectProgress,
	ConnectVerifyResult,
} from "../../src/domain/connect/connect-backup.type.ts";

export class InMemoryConnectRepository implements IConnectRepository {
	private state: ConnectState = {
		enrollment: null,
		remoteAccessEnabled: false,
		recoveryKey: null,
		operation: null,
		progress: null,
		lastBackup: null,
		lastRestore: null,
		lastVerify: null,
	};
	private stored = false;

	async setEnrollment(enrollment: ConnectEnrollment): Promise<void> {
		this.state = { ...this.state, enrollment: { ...enrollment } };
		this.stored = true;
	}

	async get(): Promise<ConnectState> {
		return {
			...this.state,
			enrollment: this.state.enrollment ? { ...this.state.enrollment } : null,
			operation: this.state.operation ? { ...this.state.operation } : null,
			progress: this.state.progress ? { ...this.state.progress } : null,
			lastBackup: this.state.lastBackup ? { ...this.state.lastBackup } : null,
			lastRestore: this.state.lastRestore ? { ...this.state.lastRestore } : null,
			lastVerify: this.state.lastVerify ? { ...this.state.lastVerify } : null,
		};
	}

	async setSecrets(secrets: { token?: string; recoveryKey?: string }): Promise<void> {
		if (secrets.token !== undefined && this.state.enrollment !== null) {
			this.state = { ...this.state, enrollment: { ...this.state.enrollment, token: secrets.token } };
		}
		if (secrets.recoveryKey !== undefined && this.state.recoveryKey !== null) {
			this.state = { ...this.state, recoveryKey: secrets.recoveryKey };
		}
	}

	async setRemoteAccess(enabled: boolean): Promise<void> {
		if (!this.stored) return;
		this.state = { ...this.state, remoteAccessEnabled: enabled };
	}

	async clearEnrollment(): Promise<void> {
		this.state = { ...this.state, enrollment: null, remoteAccessEnabled: false };
	}

	async setRecoveryKeyIfUnset(recoveryKey: string): Promise<boolean> {
		if (!this.stored || this.state.recoveryKey !== null) return false;
		this.state = { ...this.state, recoveryKey };
		return true;
	}

	async requestOperation(operation: ConnectOperationRequest): Promise<boolean> {
		if (!this.stored || this.state.operation !== null) return false;
		this.state = { ...this.state, operation: { ...operation }, progress: null };
		return true;
	}

	async markOperationStarted(at: Date): Promise<void> {
		if (this.state.operation === null) return;
		this.state = { ...this.state, operation: { ...this.state.operation, startedAt: at } };
	}

	async setProgress(progress: ConnectProgress): Promise<void> {
		if (this.state.operation === null) return;
		this.state = { ...this.state, progress: { ...progress } };
	}

	async setLastBackup(result: ConnectBackupResult): Promise<void> {
		if (!this.stored) return;
		this.state = { ...this.state, lastBackup: { ...result } };
	}

	async setLastRestore(result: ConnectBackupResult): Promise<void> {
		if (!this.stored) return;
		this.state = { ...this.state, lastRestore: { ...result } };
	}

	async setLastVerify(result: ConnectVerifyResult): Promise<void> {
		if (!this.stored) return;
		this.state = { ...this.state, lastVerify: { ...result } };
	}

	async replaceRecoveryKey(recoveryKey: string): Promise<void> {
		if (!this.stored) return;
		this.state = { ...this.state, recoveryKey };
	}

	async clearOperation(): Promise<void> {
		this.state = { ...this.state, operation: null, progress: null };
	}
}
