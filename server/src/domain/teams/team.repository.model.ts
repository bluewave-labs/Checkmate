import { Team } from "@/domain/teams/team.type.js";
import { TeamDocument, TeamModel } from "@/domain/teams/team.model.js";
import { ITeamsRepository } from "@/domain/teams/team.repository.interface.js";
import { toStringId, toDateString } from "@/utils/mongoMappers.js";
class MongoTeamsRepository implements ITeamsRepository {
	private toEntity = (doc: TeamDocument): Team => {
		return {
			id: toStringId(doc._id),
			email: doc.email,
			createdAt: toDateString(doc.createdAt),
			updatedAt: toDateString(doc.updatedAt),
		};
	};

	create = async (email: string) => {
		const team = await TeamModel.create({ email });
		return this.toEntity(team);
	};

	findAllTeamIds = async (): Promise<string[]> => {
		const teams = await TeamModel.find({}, { _id: 1 }).lean();
		return teams.map((team) => toStringId(team._id));
	};
}

export default MongoTeamsRepository;
