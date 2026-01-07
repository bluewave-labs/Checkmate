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
}

export default MongoOrgMembershipRepository;
