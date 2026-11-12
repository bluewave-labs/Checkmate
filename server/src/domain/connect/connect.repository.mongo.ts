import type { ConnectBackupResult, ConnectOperationRequest, ConnectProgress } from "@/domain/connect/connect-backup.type.js";
import ConnectStateModel, { type ConnectStateDocument } from "@/domain/connect/connect.model.js";
import { IConnectRepository } from "@/domain/connect/connect.repository.interface.js";
import type { ConnectEnrollment, ConnectState } from "@/domain/connect/connect.type.js";

class MongoConnectRepository implements IConnectRepository {
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
			operation: doc?.operation
				? {
						type: doc.operation.type,
						kind: doc.operation.kind,
						requestedAt: doc.operation.requestedAt,
						startedAt: doc.operation.startedAt ?? null,
					}
				: null,
			progress: doc?.progress
				? {
						operation: doc.progress.operation,
						stage: doc.progress.stage,
						percent: doc.progress.percent ?? null,
						bytes: doc.progress.bytes ?? null,
					}
				: null,
			lastBackup: doc?.lastBackup
				? {
						ok: doc.lastBackup.ok,
						at: doc.lastBackup.at,
						kind: doc.lastBackup.kind,
						sizeBytes: doc.lastBackup.sizeBytes ?? null,
						sha256: doc.lastBackup.sha256 ?? null,
						backupId: doc.lastBackup.backupId ?? null,
						durationMs: doc.lastBackup.durationMs ?? null,
						error: doc.lastBackup.error ?? null,
					}
				: null,
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

	clearOperation = async (): Promise<void> => {
		await ConnectStateModel.updateOne({ singleton: true }, { $set: { operation: null, progress: null } });
	};
}

export default MongoConnectRepository;
