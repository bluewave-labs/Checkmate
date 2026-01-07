import ApiError from "@/utils/ApiError.js";
import type { IEntitlementsProvider } from "@/services/system/EntitlementsService.js";
import type { Entitlements } from "@/types/entitlements.js";
import type { UserReturnable } from "@/types/domain/index.js";
import type {
  IUserRepository,
  IOrgRepository,
  IOrgMembershipRepository,
  ITeamRepository,
  ITeamMembershipRepository,
  IRoleRepository,
} from "@/repositories/index.js";

export interface IMeService {
  me(userId: string): Promise<UserReturnable>;
  getEntitlements(orgId: string): Promise<Entitlements>;
  getPermissions(user: any): Promise<{
    org: string[];
    team: { teamId: string; permission: string }[];
  }>;
}

const SERVICE_NAME = "MeService";

class MeService implements IMeService {
  public SERVICE_NAME = SERVICE_NAME;
  private entitlementsProvider: IEntitlementsProvider;
  private userRepository: IUserRepository;
  private orgRepository: IOrgRepository;
  private orgMembershipRepository: IOrgMembershipRepository;
  private teamRepository: ITeamRepository;
  private teamMembershipRepository: ITeamMembershipRepository;
  private roleRepository: IRoleRepository;

  constructor(
    entitlementsProvider: IEntitlementsProvider,
    userRepository: IUserRepository,
    orgRepository: IOrgRepository,
    orgMembershipRepository: IOrgMembershipRepository,
    teamRepository: ITeamRepository,
    teamMembershipRepository: ITeamMembershipRepository,
    roleRepository: IRoleRepository
  ) {
    this.entitlementsProvider = entitlementsProvider;
    this.userRepository = userRepository;
    this.orgRepository = orgRepository;
    this.orgMembershipRepository = orgMembershipRepository;
    this.teamRepository = teamRepository;
    this.teamMembershipRepository = teamMembershipRepository;
    this.roleRepository = roleRepository;
  }

  me = async (userId: string): Promise<UserReturnable> => {
    // Need to get teamIds
    const user = await this.userRepository.findByUserId(userId);
    if (!user) {
      throw new ApiError("User not found", 404);
    }

    // Find OrgMembership
    const orgMembership = await this.orgMembershipRepository.findByUserId(
      user.id
    );
    if (!orgMembership) {
      throw new ApiError("User is not part of any organization");
    }

    // Find org and roles
    const org = await this.orgRepository.findById(orgMembership.orgId);

    if (!org) {
      throw new ApiError("Organization not found");
    }

    const orgRole = await this.roleRepository.findById(
      orgMembership.roleId || "",
      org.id
    );

    // Get teams
    const teamMembershipsWithRole =
      await this.teamMembershipRepository.findByUserIdWithRole(user.id);

    if (!teamMembershipsWithRole) {
      throw new ApiError("Team memberships not found for user");
    }

    const teamIds = teamMembershipsWithRole.map((tm) => tm.teamId);

    const teams = await this.teamRepository.findManyById(teamIds);

    const teamMap = new Map(teams.map((t) => [t.id, t]));
    const returnableTeams = teamMembershipsWithRole.map((tm) => {
      const team = teamMap.get(tm.teamId);
      if (!team) {
        throw new ApiError("Team not found for membership");
      }
      return {
        id: team.id,
        name: team.name,
        permissions: tm.role?.permissions ?? [],
      };
    });

    const entitlements: Entitlements =
      await this.entitlementsProvider.getForOrg(org.id);

    const returnableUser: UserReturnable = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      org: {
        name: org.name,
        planKey: org.planKey,
        permissions: orgRole?.permissions || [],
      },
      teams: returnableTeams,
      entitlements,
    };

    return returnableUser;
  };

  getEntitlements = async (orgId: string): Promise<Entitlements> => {
    return this.entitlementsProvider.getForOrg(orgId);
  };

  getPermissions = async (user: any) => {
    const orgPerms: string[] = user?.roles?.orgRole?.permissions || [];
    const teamPermsArr: string[] = user?.roles?.teamRole?.permissions || [];
    const currentTeamId: string = user?.currentTeamId || "";
    return {
      org: orgPerms,
      team: Array.isArray(teamPermsArr)
        ? teamPermsArr.map((p) => ({ teamId: currentTeamId, permission: p }))
        : [],
    };
  };
}

export default MeService;
