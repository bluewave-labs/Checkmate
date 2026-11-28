import type { ISsoSessionRepository } from "@/domain/sso/sso-session.repository.interface.js";
import type { SsoSession } from "@/domain/sso/sso-session.type.js";
import { SsoSessionModel, type SsoSessionDocument } from "@/domain/sso/sso-session.model.js";
import { toStringId } from "@/utils/mongoMappers.js";

const SERVICE_NAME = "MongoSsoSessionRepository";

class MongoSsoSessionRepository implements ISsoSessionRepository {
	static SERVICE_NAME = SERVICE_NAME;

	private toEntity = (doc: SsoSessionDocument): SsoSession => {
		return {
			id: toStringId(doc._id),
			userId: toStringId(doc.userId),
			tokenHash: doc.tokenHash,
			issuedAt: doc.issuedAt,
			absoluteExpiresAt: doc.absoluteExpiresAt,
			revokedAt: doc.revokedAt ?? null,
		};
	};

	create = async (input: { userId: string; tokenHash: string; issuedAt: number; absoluteExpiresAt: Date }) => {
		const doc = await SsoSessionModel.create(input);
		return this.toEntity(doc);
	};

	findActiveByHash = async (hash: string, now: Date) => {
		const doc = await SsoSessionModel.findOne({ tokenHash: hash, revokedAt: null, absoluteExpiresAt: { $gt: now } });
		return doc ? this.toEntity(doc) : null;
	};

	rotate = async (id: string, newHash: string, issuedAt: number) => {
		await SsoSessionModel.updateOne({ _id: id }, { $set: { tokenHash: newHash, issuedAt } });
	};

	revoke = async (id: string) => {
		await SsoSessionModel.updateOne({ _id: id, revokedAt: null }, { $set: { revokedAt: new Date() } });
	};

	revokeByHash = async (hash: string) => {
		await SsoSessionModel.updateOne({ tokenHash: hash, revokedAt: null }, { $set: { revokedAt: new Date() } });
	};

	revokeAllForUser = async (userId: string) => {
		await SsoSessionModel.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
	};

	revokeAll = async () => {
		await SsoSessionModel.updateMany({ revokedAt: null }, { $set: { revokedAt: new Date() } });
	};
}

export default MongoSsoSessionRepository;
