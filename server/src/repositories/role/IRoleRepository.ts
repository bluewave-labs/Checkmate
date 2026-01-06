import { Role } from "@/types/domain/index.js";

export interface IRoleRepository {
  // create
  // single fetch
  findById(roleId: string, orgId: string): Promise<Role | null>;
  // collection fetch
  // update
  // delete
}
