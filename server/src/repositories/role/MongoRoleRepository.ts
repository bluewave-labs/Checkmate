import type { IRoleRepository } from "./IRoleRepository.js";
import { Role } from "@/db/models/index.js";
import type { IRole } from "@/db/models/index.js";
import { Role as RoleEntity } from "@/types/domain/index.js";
class MongoRoleRepository implements IRoleRepository {
  private toEntity = (doc: IRole): RoleEntity => {
    return {
      id: doc._id.toString(),
      organizationId: doc.organizationId.toString(),
      name: doc.name,
      scope: doc.scope,
      permissions: doc.permissions,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  };
  findById = async (roleId: string, orgId: string) => {
    const role = await Role.findOne({
      _id: roleId,
      organizationId: orgId,
    });
    if (!role) {
      return null;
    }
    return this.toEntity(role);
  };
}

export default MongoRoleRepository;
