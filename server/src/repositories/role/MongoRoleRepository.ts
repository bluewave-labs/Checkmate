import type { IRoleRepository } from "./IRoleRepository.js";
import { Role } from "@/db/models/index.js";
import type { RoleLike, IRole } from "@/db/models/index.js";
import type { Role as RoleEntity } from "@/types/domain/index.js";

class MongoRoleRepository implements IRoleRepository {
  private toEntity = (doc: RoleLike): RoleEntity => {
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

  createMany = async (rolesData: RoleEntity[]): Promise<RoleEntity[]> => {
    const insertedRoles = await Role.insertMany(rolesData);
    return insertedRoles.map((r) => {
      const e = {
        _id: r._id.toString(),
        organizationId: r.organizationId.toString(),
        name: r.name,
        scope: r.scope,
        permissions: r.permissions,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
      return this.toEntity(e);
    });
  };

  findById = async (roleId: string, orgId: string) => {
    const role = await Role.findOne({
      _id: roleId,
      organizationId: orgId,
    })
      .lean<IRole>()
      .exec();

    if (!role) {
      return null;
    }
    return this.toEntity(role);
  };

  deleteMany = async (roleIds: string[]) => {
    const result = await Role.deleteMany({ _id: { $in: roleIds } });
    return result.deletedCount ?? 0;
  };
}

export default MongoRoleRepository;
