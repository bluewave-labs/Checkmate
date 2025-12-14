import {
  User,
  Org,
  OrgMembership,
  Team,
  ITeam,
  IUserReturnable,
  TeamMembership,
  Role,
  IRole,
} from "@/db/models/index.js";
import ApiError from "@/utils/ApiError.js";
import type { IEntitlementsProvider } from "@/services/system/EntitlementsService.js";
import type { Entitlements } from "@/types/entitlements.js";

export interface IMeService {
  me(userId: string): Promise<IUserReturnable>;
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

  constructor(entitlementsProvider: IEntitlementsProvider) {
    this.entitlementsProvider = entitlementsProvider;
  }

  me = async (userId: string): Promise<IUserReturnable> => {
    // Need to get teamIds
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError("User not found", 404);
    }

    // Find OrgMembership
    const orgMembership = await OrgMembership.findOne({
      userId: user._id,
    }).lean();
    if (!orgMembership) {
      throw new ApiError("User is not part of any organization");
    }

    // Find org and roles
    const org = await Org.findById(orgMembership.orgId).lean();

    if (!org) {
      throw new ApiError("Organization not found");
    }

    const orgRoles = await Role.findById(orgMembership.roleId).lean();

    // Get teams
    const teamMembershipWithRoles = await TeamMembership.find({
      userId: user._id,
    })
      .populate<{ roleId: IRole }>("roleId")
      .lean();

    const teamIds = teamMembershipWithRoles.map((tm) => tm.teamId.toString());

    const teams = await Team.find({ _id: { $in: teamIds } }).select(
      "_id, name"
    );

    const teamMap = new Map(teams.map((t) => [t._id.toString(), t]));
    const returnableTeams = teamMembershipWithRoles.map((tm) => {
      const team = teamMap.get(tm.teamId.toString());
      if (!team) {
        throw new ApiError("Team not found for membership");
      }
      return {
        id: team._id.toString(),
        name: team.name,
        permissions: tm.roleId?.permissions ?? [],
      };
    });

    const entitlements: Entitlements =
      await this.entitlementsProvider.getForOrg(org._id.toString());

    const returnableUser: IUserReturnable = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      org: {
        name: org.name,
        planKey: org.planKey,
        permissions: orgRoles?.permissions || [],
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
