import ConnectStateModel, { type ConnectStateDocument } from "@/domain/connect/connect.model.js";
import { IConnectRepository } from "@/domain/connect/connect.repository.interface.js";
import type { ConnectEnrollment, ConnectState } from "@/domain/connect/connect.type.js";

export class ConnectRepositoryMongo implements IConnectRepository {
	private toEntity = (doc: ConnectStateDocument): ConnectState => {
		return {
			enrollment: doc.enrollment
				? {
						connectUrl: doc.enrollment.connectUrl,
						agentId: doc.enrollment.agentId,
						token: doc.enrollment.token,
						apiUrl: doc.enrollment.apiUrl ?? null,
					}
				: null,
		};
	};

	setEnrollment = async (enrollment: ConnectEnrollment): Promise<void> => {
		await ConnectStateModel.updateOne({ singleton: true }, { $set: { enrollment } }, { upsert: true, runValidators: true });
	};

	get = async (): Promise<ConnectState | null> => {
		const doc = await ConnectStateModel.findOne({ singleton: true }).lean<ConnectStateDocument>();
		return doc ? this.toEntity(doc) : null;
	};

	setSecrets = async (secrets: { token?: string }): Promise<void> => {
		if (secrets.token === undefined) return;
		await ConnectStateModel.updateOne({ singleton: true, enrollment: { $ne: null } }, { $set: { "enrollment.token": secrets.token } });
	};

	clearEnrollment = async (): Promise<void> => {
		await ConnectStateModel.updateOne({ singleton: true }, { $set: { enrollment: null } });
	};
}
