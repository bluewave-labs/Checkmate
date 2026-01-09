import bcrypt from "bcryptjs";
import ApiError from "@/utils/ApiError.js";
import { IJobQueue } from "../infrastructure/JobQueue.js";
import { hashPassword } from "@/utils/JWTUtils.js";
import { Plans } from "@/types/entitlements.js";
import { PERMISSIONS } from "@/types/permissions.js";
import type { Entitlements } from "@/types/entitlements.js";
import type { IEntitlementsProvider } from "@/services/system/EntitlementsService.js";
import type {
  IMonitorRepository,
  IUserRepository,
  IOrgRepository,
  IRoleRepository,
  ITeamRepository,
  IOrgMembershipRepository,
  ITeamMembershipRepository,
} from "@/repositories/index.js";
import type {
  User,
  UserReturnable,
  TokenizedUser,
  Team,
  Invite,
} from "@/types/domain/index.js";

const SERVICE_NAME = "AuthService";

export type RegisterData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type LoginData = {
  email: string;
  password: string;
};

export type AuthResult = Partial<TokenizedUser>;

export interface IAuthService {
  register(signupData: RegisterData): Promise<{
    tokenizedUser: TokenizedUser;
    returnableUser: UserReturnable;
  }>;
  registerWithInvite(
    invite: Invite,
    signupData: RegisterData,
  ): Promise<{
    tokenizedUser: TokenizedUser;
    returnableUser: UserReturnable;
  }>;
  login(loginData: LoginData): Promise<{
    tokenizedUser: TokenizedUser;
    returnableUser: UserReturnable;
  }>;
  getTeams(teamIds: string[]): Promise<Team[]>;
  changePassword(userId: string, newPassword: string): Promise<boolean>;
}

class AuthService implements IAuthService {
  public SERVICE_NAME: string;
  private jobQueue: IJobQueue;
  private entitlementsProvider: IEntitlementsProvider;
  private monitorRepository: IMonitorRepository;
  private userRepository: IUserRepository;
  private roleRepository: IRoleRepository;
  private orgRepository: IOrgRepository;
  private orgMembershipRepository: IOrgMembershipRepository;
  private teamRepository: ITeamRepository;
  private teamMembershipRepository: ITeamMembershipRepository;

  constructor(
    jobQueue: IJobQueue,
    entitlementsProvider: IEntitlementsProvider,
    monitorRepository: IMonitorRepository,
    userRepository: IUserRepository,
    roleRepository: IRoleRepository,
    orgRepository: IOrgRepository,
    orgMembershipRepository: IOrgMembershipRepository,
    teamRepository: ITeamRepository,
    teamMembershipRepository: ITeamMembershipRepository,
  ) {
    this.SERVICE_NAME = SERVICE_NAME;
    this.jobQueue = jobQueue;
    this.entitlementsProvider = entitlementsProvider;
    this.monitorRepository = monitorRepository;
    this.userRepository = userRepository;
    this.orgRepository = orgRepository;
    this.roleRepository = roleRepository;
    this.teamRepository = teamRepository;
    this.teamMembershipRepository = teamMembershipRepository;
    this.orgMembershipRepository = orgMembershipRepository;
  }

  async register(signupData: RegisterData) {
    const passwordHash = await hashPassword(signupData.password);

    const created: Record<string, any> = {
      user: null,
      org: null,
      roles: [],
      team: null,
      teamMembership: null,
      orgMembership: null,
    };

    try {
      const newUserData: Partial<User> = {
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        email: signupData.email,
        passwordHash,
      };

      const user = await this.userRepository.create(newUserData);
      created.user = user.id;

      const org = await this.orgRepository.create({
        name: `${user.firstName}'s Org`,
        ownerId: user.id,
        planKey: "free",
        entitlements: Plans["free"],
      });

      created.org = org.id;

      const roles = await this.roleRepository.createMany([
        {
          organizationId: org.id,
          name: "Org Admin",
          scope: "organization",
          permissions: ["*"],
        },
        {
          organizationId: org.id,
          name: "Org Member",
          scope: "organization",
          permissions: [
            PERMISSIONS.monitors.read,
            PERMISSIONS.monitors.write,
            PERMISSIONS.statusPages.read,
            PERMISSIONS.statusPages.write,
            PERMISSIONS.notifications.read,
            PERMISSIONS.notifications.write,
            PERMISSIONS.teams.read,
            PERMISSIONS.teams.write,
            PERMISSIONS.roles.read,
            PERMISSIONS.roles.write,
            PERMISSIONS.invite.read,
            PERMISSIONS.invite.write,
            PERMISSIONS.incidents.read,
            PERMISSIONS.incidents.write,
          ],
        },
        {
          organizationId: org.id,
          name: "Team Admin",
          permissions: [
            PERMISSIONS.monitors.all,
            PERMISSIONS.statusPages.all,
            PERMISSIONS.notifications.all,
            PERMISSIONS.incidents.all,
          ],
          scope: "team",
        },
        {
          organizationId: org.id,
          name: "Team Member",
          permissions: [
            PERMISSIONS.monitors.read,
            PERMISSIONS.statusPages.read,
            PERMISSIONS.notifications.read,
            PERMISSIONS.incidents.read,
          ],
          scope: "team",
        },
      ]);

      created.roles = roles.map((r) => r.id);

      const membership = await this.orgMembershipRepository.create({
        userId: user.id,
        orgId: org.id,
        roleId: roles[0]?.id,
      });
      created.orgMembership = membership.id;

      const team = await this.teamRepository.create({
        name: "Default Team",
        orgId: org.id,
        description: "This is your default team",
        isSystem: true,
      });
      created.team = team.id;

      const teamMembership = await this.teamMembershipRepository.create({
        orgId: org.id,
        userId: user.id,
        teamId: team.id,
        roleId: roles[2]?.id.toString(),
      });
      created.teamMembership = teamMembership.id;

      const tokenizedUser: TokenizedUser = {
        sub: user.id,
        email: user.email,
        orgId: org.id,
      };

      const returnableTeam = {
        id: team.id,
        name: team.name,
        permissions: roles[2]?.permissions || [],
      };

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
          permissions: roles[0]?.permissions || [],
        },
        teams: [returnableTeam],
        entitlements,
      };

      return { tokenizedUser, returnableUser };
    } catch (error: any) {
      await this.teamMembershipRepository.deleteById(created.teamMembership);
      await this.orgMembershipRepository.deleteById(created.orgMembership);
      await this.teamRepository.deleteById(created.team);
      await this.roleRepository.deleteMany(created.roles);
      if (created.org) await this.orgRepository.deleteById(created.org);
      if (created.user) await this.userRepository.deleteById(created.user);

      if (error.code === 11000) {
        throw new ApiError("A user with this email already exists", 409);
      }
      throw error;
    }
  }

  registerWithInvite = async (invite: Invite, signupData: RegisterData) => {
    const created: Record<string, any> = {
      user: null,
      orgMembership: null,
      teamMembership: null,
    };

    try {
      if (!invite) {
        throw new ApiError("No token found", 404);
      }

      const { orgId, orgRoleId, teamId, teamRoleId, email, expiry } = invite;

      if (expiry < new Date()) {
        throw new ApiError("Invite token has expired", 400);
      }
      if (!orgId) {
        throw new ApiError("No organization ID", 400);
      }
      // Check for org
      const org = await this.orgRepository.findById(orgId);
      if (!org) {
        throw new ApiError("Organization not found", 404);
      }

      // Get or Create user
      let user = await this.userRepository.findByEmail(email);
      if (!user) {
        const passwordHash = await hashPassword(signupData.password);
        user = await this.userRepository.create({
          email,
          firstName: signupData.firstName,
          lastName: signupData.lastName,
          passwordHash,
        });
        created.user = user.id;
      }

      const team = await this.teamRepository.findById(teamId, org.id);
      if (!team) {
        throw new ApiError("Team not found", 404);
      }

      // Get or create orgMembership
      let orgMembership = await this.orgMembershipRepository.findByUserId(
        user.id,
      );

      if (orgMembership && !orgMembership.roleId && orgRoleId) {
        orgMembership.roleId = orgRoleId;
        await this.orgMembershipRepository.update(orgMembership);
      }
      if (!orgMembership) {
        orgMembership = await this.orgMembershipRepository.create({
          orgId,
          userId: user.id,
          ...(orgRoleId ? { roleId: orgRoleId } : {}),
        });
        created.orgMembership = orgMembership.id;
      }

      // Create TeamMembership
      let teamMembership = await this.teamMembershipRepository.findByUserId(
        user.id,
        teamId,
      );
      if (teamMembership) {
        throw new ApiError("User is already a member of the team", 400);
      }
      teamMembership = await this.teamMembershipRepository.create({
        orgId,
        teamId,
        userId: user.id,
        roleId: teamRoleId,
      });
      created.teamMembership = teamMembership.id;

      // Get data for return
      const teamMembershipsWithRole =
        await this.teamMembershipRepository.findByUserIdWithRole(user.id);
      if (!teamMembershipsWithRole) {
        throw new ApiError("Team memberships not found for user", 404);
      }
      const teamIds = teamMembershipsWithRole.map((tm) => tm.teamId);

      const teams = await this.getTeams(teamIds);
      const teamMap = new Map(teams.map((t) => [t.id, t]));

      const tokenizedUser: TokenizedUser = {
        sub: user.id,
        email: user.email,
        orgId: orgId,
      };

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

      const orgRole = await this.roleRepository.findByIdAndOrgId(
        orgMembership.roleId || "",
        org.id,
      );
      const orgPermissions = orgRole?.permissions || [];

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
          permissions: orgPermissions,
        },
        teams: returnableTeams,
        entitlements,
      };

      return {
        tokenizedUser,
        returnableUser,
      };
    } catch (error) {
      if (created.orgMembership) {
        await this.orgMembershipRepository.deleteById(created.orgMembership);
      }
      if (created.teamMembership) {
        await this.teamMembershipRepository.deleteById(created.teamMembership);
      }
      if (created.user) {
        await this.userRepository.deleteById(created.user);
      }
      throw error;
    }
  };

  async login(loginData: LoginData): Promise<{
    tokenizedUser: TokenizedUser;
    returnableUser: UserReturnable;
  }> {
    const { email, password } = loginData;

    // Find user by email
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new ApiError("Invalid email or password");
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new ApiError("Invalid email or password");
    }

    // Find OrgMembership
    const orgMembership = await this.orgMembershipRepository.findByUserId(
      user.id,
    );

    if (!orgMembership) {
      throw new ApiError("User is not part of any organization");
    }

    // Find org and roles
    let org = await this.orgRepository.findById(orgMembership.orgId);

    if (!org) {
      throw new ApiError("Organization not found");
    }

    // Update org entitlements
    const planKey = org.entitlements.plan;
    org = await this.orgRepository.updateById(org.id, {
      entitlements: Plans[planKey],
    });

    if (!org) {
      throw new ApiError("Organization entitlement error");
    }

    const orgRoles = await this.roleRepository.findByIdAndOrgId(
      orgMembership.roleId || "",
      org.id,
    );

    // Get teams
    const teamMemberships =
      await this.teamMembershipRepository.findByUserIdWithRole(user.id);
    if (!teamMemberships) {
      throw new ApiError("Team memberships not found for user", 404);
    }

    const teamIds = teamMemberships.map((tm) => tm.teamId);

    const teams = await this.getTeams(teamIds);
    const teamMap = new Map(teams.map((t) => [t.id, t]));
    const returnableTeams = teamMemberships.map((tm) => {
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

    const tokenizedUser: TokenizedUser = {
      sub: user.id,
      email: user.email,
      orgId: orgMembership.orgId,
    };

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
        permissions: orgRoles?.permissions || [],
      },
      teams: returnableTeams,
      entitlements,
    };

    return {
      tokenizedUser,
      returnableUser,
    };
  }

  async getTeams(teamIds: string[]): Promise<Team[]> {
    return await this.teamRepository.findManyById(teamIds);
  }

  changePassword = async (
    userId: string,
    newPassword: string,
  ): Promise<boolean> => {
    try {
      const passwordHash = await hashPassword(newPassword);
      const result = await this.userRepository.updateById(userId, {
        passwordHash,
      });
      return Boolean(result);
    } catch (error) {
      throw error;
    }
  };
}

export default AuthService;
