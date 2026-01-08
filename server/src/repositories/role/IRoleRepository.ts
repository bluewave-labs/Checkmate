import { Role } from "@/types/domain/index.js";

export interface IRoleRepository {
  // create
  createMany(rolesData: Array<Partial<Role>>): Promise<Role[]>;
  // single fetch
  findById(roleId: string): Promise<Role | null>;
  findByIdAndOrgId(roleId: string, orgId: string): Promise<Role | null>;
  // collection fetch
  findAll(orgId: string): Promise<Role[]>;
  findAllByScope(orgId: string, scope: string): Promise<Role[]>;
  findAllByTeam(orgId: string, teamId: string): Promise<Role[]>;
  // update
  // delete
  deleteMany(roleIds: string[]): Promise<number>;
}
