import type { ISsoLoginStateRepository } from "@/domain/sso/sso-login-state.repository.interface.js";
import { SsoLoginStateModel } from "@/domain/sso/sso-login-state.model.js";

const SERVICE_NAME = "MongoSsoLoginStateRepository";

class MongoSsoLoginStateRepository implements ISsoLoginStateRepository {
	static SERVICE_NAME = SERVICE_NAME;

	create = async (state: string, returnOrigin: string, expiresAt: Date) => {
		await SsoLoginStateModel.create({ state, returnOrigin, expiresAt });
	};

	consume = async (state: string, now: Date) => {
		const doc = await SsoLoginStateModel.findOneAndUpdate({ state, usedAt: null, expiresAt: { $gt: now } }, { $set: { usedAt: now } });
		return doc ? { returnOrigin: doc.returnOrigin } : null;
	};
}

export default MongoSsoLoginStateRepository;
