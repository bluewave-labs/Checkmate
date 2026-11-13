import type {
	ConnectBackupResult,
	ConnectOperationRequest,
	ConnectProgress,
	ConnectSchedule,
	ConnectVerifyResult,
} from "@/domain/connect/connect-backup.type.js";
import ConnectStateModel, { type ConnectOperationDocument, type ConnectStateDocument } from "@/domain/connect/connect.model.js";
import { IConnectRepository } from "@/domain/connect/connect.repository.interface.js";
import type { ConnectEnrollment, ConnectState } from "@/domain/connect/connect.type.js";

class MongoConnectRepository implements IConnectRepository {
	private toOperation = (operation: ConnectOperationDocument): ConnectOperationRequest | null => {
		const requestedAt = operation.requestedAt;
		const startedAt = operation.startedAt ?? null;
		if (operation.type === "backup" && operation.kind) return { type: "backup", kind: operation.kind, requestedAt, startedAt };
		if (operation.type === "restore" && operation.backupId) return { type: "restore", backupId: operation.backupId, requestedAt, startedAt };
		if (operation.type === "verify" && operation.recoveryKey) {
			return { type: "verify", recoveryKey: operation.recoveryKey, replaceExisting: operation.replaceExisting ?? false, requestedAt, startedAt };
		}
		return null;
	};

	private toResult = (result: ConnectBackupResult): ConnectBackupResult => {
		return {
			ok: result.ok,
			at: result.at,
			kind: result.kind ?? null,
			sizeBytes: result.sizeBytes ?? null,
			sha256: result.sha256 ?? null,
			backupId: result.backupId ?? null,
			durationMs: result.durationMs ?? null,
			error: result.error ?? null,
		};
	};

	private toEntity = (doc: ConnectStateDocument | null): ConnectState => {
		return {
			enrollment: doc?.enrollment
				? {
						connectUrl: doc.enrollment.connectUrl,
						agentId: doc.enrollment.agentId,
						token: doc.enrollment.token,
						apiUrl: doc.enrollment.apiUrl ?? null,
					}
				: null,
			remoteAccessEnabled: doc?.remoteAccessEnabled ?? false,
			recoveryKey: doc?.recoveryKey ?? null,
			operation: doc?.operation ? this.toOperation(doc.operation) : null,
			progress: doc?.progress
				? {
						operation: doc.progress.operation,
						stage: doc.progress.stage,
						percent: doc.progress.percent ?? null,
						bytes: doc.progress.bytes ?? null,
						attempt: doc.progress.attempt ?? null,
						attempts: doc.progress.attempts ?? null,
					}
				: null,
			lastBackup: doc?.lastBackup ? this.toResult(doc.lastBackup) : null,
			lastRestore: doc?.lastRestore ? this.toResult(doc.lastRestore) : null,
			lastVerify: doc?.lastVerify ? { outcome: doc.lastVerify.outcome, at: doc.lastVerify.at, error: doc.lastVerify.error ?? null } : null,
			schedule: doc?.schedule ? { enabled: doc.schedule.enabled, intervalHours: doc.schedule.intervalHours, kind: doc.schedule.kind } : null,
		};
	};

	setEnrollment = async (enrollment: ConnectEnrollment): Promise<void> => {
		await ConnectStateModel.updateOne({ singleton: true }, { $set: { enrollment } }, { upsert: true, runValidators: true });
	};

	get = async (): Promise<ConnectState> => {
		const doc = await ConnectStateModel.findOne({ singleton: true }).lean<ConnectStateDocument>();
		return this.toEntity(doc);
	};

	setSecrets = async (secrets: { token?: string; recoveryKey?: string }): Promise<void> => {
		if (secrets.token !== undefined) {
			await ConnectStateModel.updateOne({ singleton: true, enrollment: { $ne: null } }, { $set: { "enrollment.token": secrets.token } });
		}
		if (secrets.recoveryKey !== undefined) {
			await ConnectStateModel.updateOne({ singleton: true, recoveryKey: { $ne: null } }, { $set: { recoveryKey: secrets.recoveryKey } });
		}
	};

	setRemoteAccess = async (enabled: boolean): Promise<void> => {
		await ConnectStateModel.updateOne({ singleton: true }, { $set: { remoteAccessEnabled: enabled } });
	};

	clearEnrollment = async (): Promise<void> => {
		await ConnectStateModel.updateOne({ singleton: true }, { $set: { enrollment: null, remoteAccessEnabled: false } });
	};

	setRecoveryKeyIfUnset = async (recoveryKey: string): Promise<boolean> => {
		const res = await ConnectStateModel.updateOne({ singleton: true, recoveryKey: null }, { $set: { recoveryKey } });
		return res.modifiedCount === 1;
	};

	requestOperation = async (operation: ConnectOperationRequest): Promise<boolean> => {
		const res = await ConnectStateModel.updateOne(
			{ singleton: true, operation: null },
			{ $set: { operation, progress: null } },
			{ runValidators: true }
		);
		return res.modifiedCount === 1;
	};

	markOperationStarted = async (at: Date): Promise<void> => {
		await ConnectStateModel.updateOne({ singleton: true, operation: { $ne: null } }, { $set: { "operation.startedAt": at } });
	};

	setProgress = async (progress: ConnectProgress): Promise<void> => {
		await ConnectStateModel.updateOne({ singleton: true, operation: { $ne: null } }, { $set: { progress } }, { runValidators: true });
	};

	setLastBackup = async (result: ConnectBackupResult): Promise<void> => {
		await ConnectStateModel.updateOne({ singleton: true }, { $set: { lastBackup: result } }, { runValidators: true });
	};

	setLastRestore = async (result: ConnectBackupResult): Promise<void> => {
		await ConnectStateModel.updateOne({ singleton: true }, { $set: { lastRestore: result } }, { runValidators: true });
	};

	setLastVerify = async (result: ConnectVerifyResult): Promise<void> => {
		await ConnectStateModel.updateOne({ singleton: true }, { $set: { lastVerify: result } }, { runValidators: true });
	};

	replaceRecoveryKey = async (recoveryKey: string): Promise<void> => {
		await ConnectStateModel.updateOne({ singleton: true }, { $set: { recoveryKey } });
	};

	setSchedule = async (schedule: ConnectSchedule): Promise<void> => {
		await ConnectStateModel.updateOne({ singleton: true }, { $set: { schedule } }, { runValidators: true });
	};

	clearOperation = async (): Promise<void> => {
		await ConnectStateModel.updateOne({ singleton: true }, { $set: { operation: null, progress: null } });
	};
}

export default MongoConnectRepository;
