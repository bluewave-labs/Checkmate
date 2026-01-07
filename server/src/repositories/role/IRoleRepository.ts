import { Role } from "@/types/domain/index.js";

export interface IRoleRepository {
  // create
  createMany(rolesData: Array<Partial<Role>>): Promise<Role[]>;
  // single fetch
  findById(roleId: string, orgId: string): Promise<Role | null>;
  // collection fetch
  // update
  // delete
  deleteMany(roleIds: string[]): Promise<number>;
}
