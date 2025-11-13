import { Role, IRole } from "@/db/models/index.js";
import type { IJobQueue } from "../infrastructure/JobQueue.js";
import ApiError from "@/utils/ApiError.js";

const SERVICE_NAME = "RoleService";
export interface IRoleService {
  getAll: (orgId: string, type: string) => Promise<Partial<IRole[]>>;
  getTeam: (orgId: string, teamId: string) => Promise<Partial<IRole[]>>;
  get: (roleId: string) => Promise<IRole>;
}

class RoleService implements IRoleService {
  public SERVICE_NAME: string;

  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
  }

  getAll = async (orgId: string, type: string) => {
    if (!type) {
      return await Role.find({ organizationId: orgId });
    }
    const roles = await Role.find({ organizationId: orgId, scope: type });
    return roles;
  };

  getTeam = async (orgId: string, teamId: string) => {
    const roles = await Role.find({
      organizationId: orgId,
      teamId,
      scope: "team",
    });
    return roles;
  };

  get = async (roleId: string) => {
    const role = await Role.findById(roleId);
    if (!role) {
      throw new ApiError("Role not found", 404);
    }
    return role;
  };
}

export default RoleService;
