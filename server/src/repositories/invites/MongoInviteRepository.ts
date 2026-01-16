import { IInvitesRepository } from "@/repositories/index.js";
import type { Invite } from "@/types/index.js";
import { type InviteDocument, InviteModel } from "@/db/models/index.js";
import { AppError } from "@/utils/AppError.js";
import mongoose from "mongoose";

class MongoInvitesRepository implements IInvitesRepository {
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

	protected toEntity = (doc: InviteDocument): Invite => {
		return {
			id: this.toStringId(doc._id),
			email: doc.email,
			teamId: this.toStringId(doc.teamId),
			role: doc.role ?? [],
			token: doc.token,
			expiry: this.toDateString(doc.expiry),
			createdAt: this.toDateString(doc.createdAt),
			updatedAt: this.toDateString(doc.updatedAt),
		};
	};

	findByTokenAndDelete = async (token: string) => {
		const invite = await InviteModel.findOneAndDelete({
			token,
		});
		if (invite === null) {
			throw new AppError({ message: "Invite not found", status: 404 });
		}
		return this.toEntity(invite);
	};
}
export default MongoInvitesRepository;
