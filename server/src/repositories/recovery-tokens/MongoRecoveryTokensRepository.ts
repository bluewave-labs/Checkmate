import type { RecoveryToken } from "@/types/index.js";
import type { IRecoveryTokensRepository } from "./IRecoveryTokensRepository.js";
import type { RecoveryTokenDocument } from "@/db/models/RecoveryToken.js";
import { RecoveryTokenModel } from "@/db/models/RecoveryToken.js";
import mongoose from "mongoose";
import crypto from "crypto";
import { AppError } from "@/utils/AppError.js";
const SERVICE_NAME = "MongoRecoveryTokensRepository";

class MongoRecoveryTokensRepository implements IRecoveryTokensRepository {
	static SERVICE_NAME = SERVICE_NAME;
	private toStringId = (value?: mongoose.Types.ObjectId | string | null): string => {
		if (!value) {
			return "";
		}
		return value instanceof mongoose.Types.ObjectId ? value.toString() : String(value);
	};

	private toDateString = (value?: Date | string | null): string => {
		if (!value) {
			return new Date(0).toISOString();
		}
		return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
	};

	protected toEntity = (doc: RecoveryTokenDocument): RecoveryToken => {
		return {
			id: this.toStringId(doc._id),
			email: doc.email,
			token: doc.token,
			expiry: this.toDateString(doc.expiry),
			createdAt: this.toDateString(doc.createdAt),
			updatedAt: this.toDateString(doc.updatedAt),
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
			throw new AppError({ message: "Recovery token not found", service: SERVICE_NAME, status: 404 });
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
