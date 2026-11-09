import { ConnectStateModel } from "@/domain/connect/connect.model.js";
import type { ConnectBackupResult, ConnectState } from "@/domain/connect/connect.type.js";

export interface IConnectRepository {
	load(): Promise<ConnectState | null>;
	save(state: ConnectState): Promise<void>;
	loadLastScheduledBackup(): Promise<ConnectBackupResult | null>;
	saveLastScheduledBackup(result: ConnectBackupResult): Promise<void>;
}

export class MongoConnectRepository implements IConnectRepository {
	load = async (): Promise<ConnectState | null> => {
		const doc = await ConnectStateModel.findOne({ singleton: true }).lean();
		if (!doc) return null;
		return {
			enrollment: doc.enrollment ?? null,
			remoteAccessEnabled: doc.remoteAccessEnabled ?? false,
			recoveryKey: doc.recoveryKey ?? null,
			schedule: doc.schedule ?? null,
		};
	};

	save = async (state: ConnectState): Promise<void> => {
		await ConnectStateModel.updateOne({ singleton: true }, { $set: state }, { upsert: true });
	};

	// Kept out of ConnectState: save() writes every field from the primary's copy
	// and would overwrite a result recorded by a worker.
	loadLastScheduledBackup = async (): Promise<ConnectBackupResult | null> => {
		const doc = await ConnectStateModel.findOne({ singleton: true }, { lastScheduledBackup: 1 }).lean();
		return doc?.lastScheduledBackup ?? null;
	};

	saveLastScheduledBackup = async (result: ConnectBackupResult): Promise<void> => {
		await ConnectStateModel.updateOne({ singleton: true }, { $set: { lastScheduledBackup: result } });
	};
}
