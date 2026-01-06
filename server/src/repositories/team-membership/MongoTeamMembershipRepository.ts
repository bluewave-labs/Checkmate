import { type ITeamMembership, TeamMembership } from "@/db/models/index.js";
import type { ITeamMembershipRepository } from "@/repositories/index.js";
import { TeamMembership as TeamMembershipEntity } from "@/types/domain/index.js";
class MongoTeamMembershipRepository implements ITeamMembershipRepository {
  private toEntity = (doc: ITeamMembership): TeamMembershipEntity => {
    return {
      id: doc._id.toString(),
      orgId: doc.orgId.toString(),
      teamId: doc.teamId.toString(),
      userId: doc.userId.toString(),
      roleId: doc.roleId.toString(),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  };
  findByUserId = async (userId: string, teamId: string) => {
    const membership = await TeamMembership.findOne({
      userId,
      teamId,
    });
    if (!membership) return null;
    return this.toEntity(membership);
  };
}

export default MongoTeamMembershipRepository;
