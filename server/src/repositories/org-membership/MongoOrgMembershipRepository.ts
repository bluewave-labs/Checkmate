import { type IOrgMembership, OrgMembership } from "@/db/models/index.js";
import { IOrgMembershipRepository } from "@/repositories/index.js";
import { OrgMembership as OrgMembershipEntity } from "@/types/domain/index.js";

class MongoOrgMembershipRepository implements IOrgMembershipRepository {
  private toEntity = (doc: IOrgMembership): OrgMembershipEntity => {
    return {
      id: doc._id.toString(),
      orgId: doc.orgId.toString(),
      userId: doc.userId.toString(),
      roleId: doc.roleId?.toString(),
      role: doc.roleId?.toString() || "",
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  };

  create = async (orgMembershipData: Partial<OrgMembershipEntity>) => {
    const membership = await OrgMembership.create(orgMembershipData);
    return this.toEntity(membership);
  };

  findByUserId = async (userId: string) => {
    const orgMembership = await OrgMembership.findOne({
      userId,
    });
    if (!orgMembership) return null;
    return this.toEntity(orgMembership);
  };

  update = async (orgMembership: Partial<OrgMembershipEntity>) => {
    const updated = await OrgMembership.findOneAndUpdate(
      { _id: orgMembership.id },
      {
        $set: {
          ...orgMembership,
          updatedAt: new Date(),
        },
      },
      { new: true }
    );
    if (!updated) return null;
    return this.toEntity(updated);
  };

  deleteById = async (membershipId: string) => {
    const result = await OrgMembership.deleteOne({ _id: membershipId });
    return result.deletedCount === 1;
  };
}

export default MongoOrgMembershipRepository;
