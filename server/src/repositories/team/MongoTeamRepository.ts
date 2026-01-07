import type { ITeamRepository } from "@/repositories/index.js";
import { type ITeam, Team } from "@/db/models/index.js";
import { Team as TeamEntity } from "@/types/domain/index.js";

class MongoTeamRepository implements ITeamRepository {
  private toEntity = (doc: ITeam): TeamEntity => {
    return {
      id: doc._id.toString(),
      orgId: doc.orgId.toString(),
      name: doc.name,
      description: doc.description,
      isSystem: doc.isSystem,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  };

  create = async (team: Partial<TeamEntity>) => {
    const created = await Team.create(team);
    return this.toEntity(created);
  };

  findById = async (teamId: string, orgId: string) => {
    const team = await Team.findOne({
      _id: teamId,
      orgId,
    });
    if (!team) {
      return null;
    }
    return this.toEntity(team);
  };

  findManyById = async (teamIds: string[]) => {
    const teams = await Team.find({ _id: { $in: teamIds } });
    return teams.map(this.toEntity);
  };

  deleteById = async (teamId: string) => {
    const result = await Team.deleteOne({ _id: teamId });
    return result.deletedCount === 1;
  };
}

export default MongoTeamRepository;
