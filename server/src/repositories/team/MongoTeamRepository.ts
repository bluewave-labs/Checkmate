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
}

export default MongoTeamRepository;
