import { type ITeamMembership, TeamMembership } from "@/db/models/index.js";
import type { ITeamMembershipRepository } from "@/repositories/index.js";
import {
  TeamMembership as TeamMembershipEntity,
  TeamMembershipWithDetails,
} from "@/types/domain/index.js";
import type { IRole } from "@/db/models/index.js";

type TeamMembershipPopulated = Omit<ITeamMembership, "roleId"> & {
  roleId: IRole;
};

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

  private toEntityWithDetails = (
    doc: TeamMembershipPopulated
  ): TeamMembershipWithDetails => {
    return {
      id: doc._id.toString(),
      orgId: doc.orgId.toString(),
      teamId: doc.teamId.toString(),
      userId: doc.userId.toString(),
      roleId: doc.roleId.toString(),
      role: {
        id: doc.roleId._id.toString(),
        organizationId: doc.roleId.organizationId.toString(),
        name: doc.roleId.name,
        permissions: doc.roleId.permissions,
        createdAt: doc.roleId.createdAt,
        updatedAt: doc.roleId.updatedAt,
      },
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  };
  create = async (membership: Partial<TeamMembershipEntity>) => {
    const created = await TeamMembership.create(membership);
    return this.toEntity(created);
  };

  findByUserId = async (userId: string, teamId: string) => {
    const membership = await TeamMembership.findOne({
      userId,
      teamId,
    });
    if (!membership) return null;
    return this.toEntity(membership);
  };

  findByUserIdWithRole = async (userId: string) => {
    const teamMembershipsWithRole = await TeamMembership.find({
      userId: userId,
    })
      .populate<{ roleId: IRole }>("roleId")
      .lean<TeamMembershipPopulated[]>();
    return teamMembershipsWithRole.map(this.toEntityWithDetails);
  };

  deleteById = async (membershipId: string) => {
    const result = await TeamMembership.deleteOne({ _id: membershipId });
    return result.deletedCount === 1;
  };
}

export default MongoTeamMembershipRepository;
