import type { RecoveryToken } from "@/domain/recovery-tokens/recovery-token.type.js";
import type { IRecoveryTokensRepository } from "./recovery-token.repository.interface.js";
import type { RecoveryTokenDocument } from "@/domain/recovery-tokens/recovery-token.model.js";
import { RecoveryTokenModel } from "@/domain/recovery-tokens/recovery-token.model.js";
import crypto from "crypto";
import { AppError } from "@/utils/AppError.js";
import { toStringId, toDateString } from "@/utils/mongoMappers.js";
import { recoveryTokenErrors } from "@/domain/recovery-tokens/recovery-token.errors.js";
const SERVICE_NAME = "MongoRecoveryTokensRepository";

class MongoRecoveryTokensRepository implements IRecoveryTokensRepository {
	static SERVICE_NAME = SERVICE_NAME;

	private toEntity = (doc: RecoveryTokenDocument): RecoveryToken => {
		return {
			id: toStringId(doc._id),
			email: doc.email,
			token: doc.token,
			expiry: toDateString(doc.expiry),
			createdAt: toDateString(doc.createdAt),
			updatedAt: toDateString(doc.updatedAt),
		};
	};

	create = async (email: string): Promise<RecoveryToken> => {
		const token = await RecoveryTokenModel.create({
			email,
			token: crypto.randomBytes(32).toString("hex"),
		});
		return this.toEntity(token);
	};

	findByToken = async (token: string): Promise<RecoveryToken> => {
		const recoveryToken = await RecoveryTokenModel.findOne({ token });
		if (!recoveryToken) {
			throw new AppError(recoveryTokenErrors.notFound, { service: SERVICE_NAME, method: "findByToken" });
		}
		return this.toEntity(recoveryToken);
	};

	deleteManyByEmail = async (email: string) => {
		const result = await RecoveryTokenModel.deleteMany({
			email,
		});
		return Promise.resolve(result.deletedCount || 0);
	};
}

export default MongoRecoveryTokensRepository;
