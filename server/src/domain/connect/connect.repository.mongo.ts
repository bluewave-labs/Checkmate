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
		};
	};

	setEnrollment = async (enrollment: ConnectEnrollment): Promise<void> => {
		await ConnectStateModel.updateOne({ singleton: true }, { $set: { enrollment } }, { upsert: true, runValidators: true });
	};

	get = async (): Promise<ConnectState> => {
		const doc = await ConnectStateModel.findOne({ singleton: true }).lean<ConnectStateDocument>();
		return this.toEntity(doc);
	};

	setSecrets = async (secrets: { token?: string }): Promise<void> => {
		if (secrets.token === undefined) return;
		await ConnectStateModel.updateOne({ singleton: true, enrollment: { $ne: null } }, { $set: { "enrollment.token": secrets.token } });
	};

	setRemoteAccess = async (enabled: boolean): Promise<void> => {
		await ConnectStateModel.updateOne({ singleton: true }, { $set: { remoteAccessEnabled: enabled } });
	};

	clearEnrollment = async (): Promise<void> => {
		await ConnectStateModel.updateOne({ singleton: true }, { $set: { enrollment: null, remoteAccessEnabled: false } });
	};
}

export default MongoConnectRepository;
