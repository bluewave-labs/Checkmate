import type { IRoleRepository } from "@/repositories/index.js";
import ApiError from "@/utils/ApiError.js";
import { Role as RoleEntity } from "@/types/domain/index.js";

const SERVICE_NAME = "RoleService";
export interface IRoleService {
  getAll: (orgId: string, type: string) => Promise<Partial<RoleEntity[]>>;
  getTeam: (orgId: string, teamId: string) => Promise<Partial<RoleEntity[]>>;
  get: (roleId: string) => Promise<RoleEntity>;
}

class RoleService implements IRoleService {
  public SERVICE_NAME: string;
  private roleRepository: IRoleRepository;

  constructor(roleRepository: IRoleRepository) {
    this.SERVICE_NAME = SERVICE_NAME;
    this.roleRepository = roleRepository;
  }

  getAll = async (orgId: string, type: string) => {
    if (!type) {
      return await this.roleRepository.findAll(orgId);
    }
    return await this.roleRepository.findAllByScope(orgId, type);
  };

  getTeam = async (orgId: string, teamId: string) => {
    return await this.roleRepository.findAllByTeam(orgId, teamId);
  };

  get = async (roleId: string) => {
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new ApiError("Role not found", 404);
    }
    return role;
  };
}

export default RoleService;
