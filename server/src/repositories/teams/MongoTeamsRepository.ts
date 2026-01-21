import { Team } from "@/types/index.js";
import { TeamDocument, TeamModel } from "@/db/models/index.js";
import { ITeamRepository } from "@/repositories/index.js";
import mongoose from "mongoose";

class MongoTeamRepository implements ITeamRepository {
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

	private toEntity = (doc: TeamDocument): Team => {
		return {
			id: this.toStringId(doc._id),
			email: doc.email,
			createdAt: this.toDateString(doc.createdAt),
			updatedAt: this.toDateString(doc.updatedAt),
		};
	};

	create = async (email: string) => {
		const team = await TeamModel.create({ email });
		return this.toEntity(team);
	};
}

export default MongoTeamRepository;
