import { ConnectStateModel } from "@/domain/connect/connect.model.js";
import type { ConnectState } from "@/domain/connect/connect.type.js";

export interface IConnectRepository {
	load(): Promise<ConnectState | null>;
	save(state: ConnectState): Promise<void>;
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
}
