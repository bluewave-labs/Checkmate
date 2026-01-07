import { Types } from "mongoose";
import type { IRoleRepository } from "./IRoleRepository.js";
import { Role } from "@/db/models/index.js";
import type { IRole } from "@/db/models/index.js";
import type { Role as RoleEntity } from "@/types/domain/index.js";

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

  createMany = async (rolesData: RoleEntity[]): Promise<RoleEntity[]> => {
    const docs = rolesData.map((role) => ({
      ...role,
      organizationId: role.organizationId
        ? new Types.ObjectId(role.organizationId)
        : undefined,
    }));

    const insertedRoles = await Role.insertMany(docs);
    return insertedRoles.map((r) => {
      return this.toEntity({
        _id: r._id,
        organizationId: r.organizationId || new Types.ObjectId(),
        name: r.name,
        scope: r.scope,
        permissions: r.permissions,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      });
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
}

export default MongoRoleRepository;
