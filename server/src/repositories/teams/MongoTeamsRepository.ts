import { Team } from "@/types/index.js";
import { TeamDocument, TeamModel } from "@/db/models/index.js";
import { ITeamsRepository } from "@/repositories/index.js";
import mongoose from "mongoose";

class MongoTeamsRepository implements ITeamsRepository {
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

	findAllTeamIds = async (): Promise<string[]> => {
		const teams = await TeamModel.find({}, { _id: 1 }).lean();
		return teams.map((team) => this.toStringId(team._id));
	};
}

export default MongoTeamsRepository;
