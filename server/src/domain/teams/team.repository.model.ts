import { Team } from "@/domain/teams/team.type.js";
import { TeamDocument, TeamModel } from "@/domain/teams/team.model.js";
import { ITeamsRepository } from "@/domain/teams/team.repository.interface.js";
import { toStringId, toDateString } from "@/utils/mongoMappers.js";
import { AppError } from "@/utils/AppError.js";
import { teamErrors } from "@/domain/teams/team.errors.js";

const SERVICE_NAME = "MongoTeamsRepository";
class MongoTeamsRepository implements ITeamsRepository {
	static SERVICE_NAME = SERVICE_NAME;
	// heartbeatKeyHash is deliberately not mapped: it never leaves the repository
	private toEntity = (doc: TeamDocument): Team => {
		return {
			id: toStringId(doc._id),
			email: doc.email,
			heartbeatKeyCreatedBy: doc.heartbeatKeyCreatedBy ? toStringId(doc.heartbeatKeyCreatedBy) : undefined,
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

	setHeartbeatKey = async (teamId: string, hash: string, userId: string): Promise<void> => {
		const res = await TeamModel.updateOne(
			{ _id: teamId },
			{
				$set: { heartbeatKeyHash: hash, heartbeatKeyCreatedBy: userId },
			}
		);
		if (res.matchedCount === 0) {
			throw new AppError(teamErrors.notFound, { service: SERVICE_NAME });
		}
	};

	findByHeartbeatKeyHash = async (hash: string): Promise<Team | null> => {
		const doc = await TeamModel.findOne({ heartbeatKeyHash: hash }).lean<TeamDocument>();
		return doc ? this.toEntity(doc) : null;
	};

	hasHeartbeatKey = async (teamId: string): Promise<boolean> => {
		const exists = await TeamModel.exists({
			_id: teamId,
			heartbeatKeyHash: { $type: "string" },
		});
		return exists !== null;
	};
}

export default MongoTeamsRepository;
