import bcrypt from "bcryptjs";
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
  IUser,
  ITokenizedUser,
  Monitor,
  Check,
  NotificationChannel,
  IInvite,
} from "@/db/models/index.js";
import { Types } from "mongoose";
import ApiError from "@/utils/ApiError.js";
import { IJobQueue } from "../infrastructure/JobQueue.js";
import { hashPassword } from "@/utils/JWTUtils.js";
import { Plans } from "@/types/entitlements.js";
import { PERMISSIONS } from "@/types/permissions.js";
import type { Entitlements } from "@/types/entitlements.js";
import type { IEntitlementsProvider } from "@/services/system/EntitlementsService.js";

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

export type AuthResult = Partial<ITokenizedUser>;

export interface IAuthService {
  me(userId: string): Promise<IUserReturnable>;
  register(signupData: RegisterData): Promise<{
    tokenizedUser: ITokenizedUser;
    returnableUser: IUserReturnable;
  }>;
  registerWithInvite(
    invite: IInvite,
    signupData: RegisterData
  ): Promise<{
    tokenizedUser: ITokenizedUser;
    returnableUser: IUserReturnable;
  }>;
  login(loginData: LoginData): Promise<{
    tokenizedUser: ITokenizedUser;
    returnableUser: IUserReturnable;
  }>;
  getTeamIds(userId: string): Promise<string[]>;
  getTeams(teamIds: string[]): Promise<ITeam[]>;
  cleanup(): Promise<void>;
  cleanMonitors(): Promise<void>;
  changePassword(userId: Types.ObjectId, newPassword: string): Promise<boolean>;
}

class AuthService implements IAuthService {
  public SERVICE_NAME: string;
  private jobQueue: IJobQueue;
  private entitlementsProvider: IEntitlementsProvider;
  constructor(jobQueue: IJobQueue, entitlementsProvider: IEntitlementsProvider) {
    this.SERVICE_NAME = SERVICE_NAME;
    this.jobQueue = jobQueue;
    this.entitlementsProvider = entitlementsProvider;
  }

  me = async (userId: string) => {
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

    const teams = await this.getTeams(teamIds);
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

    const entitlements: Entitlements = await this.entitlementsProvider.getForOrg(
      org._id.toString()
    );

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
      const newUserData: Partial<IUser> = {
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        email: signupData.email,
        passwordHash,
      };

      const user = await User.create(newUserData);
      created.user = user._id;

      const org = await Org.create({
        name: `${user.firstName}'s Org`,
        ownerId: user._id,
        planKey: "free",
        entitlements: Plans["free"],
      });
      created.org = org._id;

      const roles = await Role.insertMany([
        {
          organizationId: org._id,
          name: "Org Admin",
          scope: "organization",
          permissions: ["*"],
        },
        {
          organizationId: org._id,
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
          organizationId: org._id,
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
          organizationId: org._id,
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

      created.roles = roles.map((r) => r._id);

      const membership = await OrgMembership.create({
        userId: user._id,
        orgId: org._id,
        roleId: roles[0]?._id,
      });
      created.orgMembership = membership._id;

      const team = await Team.create({
        name: "Default Team",
        orgId: org._id,
        description: "This is your default team",
        isSystem: true,
      });
      created.team = team._id;

      const teamMembership = await TeamMembership.create({
        orgId: org._id,
        userId: user._id,
        teamId: team._id,
        roleId: roles[2]?._id,
      });
      created.teamMembership = teamMembership._id;

      const tokenizedUser: ITokenizedUser = {
        sub: user._id.toString(),
        email: user.email,
        orgId: org._id.toString(),
      };

      const returnableTeam = {
        id: team._id.toString(),
        name: team.name,
        permissions: roles[2]?.permissions || [],
      };

      const provider = EntitlementsFactory.create();
      const entitlements: Entitlements = await provider.getForOrg(
        org._id.toString()
      );

      const returnableUser: IUserReturnable = {
        id: user._id.toString(),
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
    } catch (error) {
      await TeamMembership.deleteOne({ _id: created.teamMembership });
      await OrgMembership.deleteOne({ _id: created.orgMembership });
      await Team.deleteOne({ _id: created.team });
      await Role.deleteMany({ _id: { $in: created.roles } });
      if (created.org) await Org.findByIdAndDelete(created.org);
      if (created.user) await User.findByIdAndDelete(created.user);
      throw error;
    }
  }

  registerWithInvite = async (invite: IInvite, signupData: RegisterData) => {
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
      const org = await Org.findById(orgId);
      if (!org) {
        throw new ApiError("Organization not found", 404);
      }

      // Get or Create user
      let user = await User.findOne({ email });
      if (!user) {
        const passwordHash = await hashPassword(signupData.password);
        user = await User.create({
          email,
          firstName: signupData.firstName,
          lastName: signupData.lastName,
          passwordHash,
        });
        created.user = user._id;
      }

      const team = await Team.findById(teamId);
      if (!team) {
        throw new ApiError("Team not found", 404);
      }

      // Get or create orgMembership
      let orgMembership = await OrgMembership.findOne({
        userId: user._id,
        orgId,
      });
      if (orgMembership && !orgMembership.roleId && orgRoleId) {
        orgMembership.roleId = orgRoleId;
        await orgMembership.save();
      }
      if (!orgMembership) {
        orgMembership = await OrgMembership.create({
          orgId,
          userId: user._id,
          ...(orgRoleId ? { roleId: orgRoleId } : {}),
        });
        created.orgMembership = orgMembership._id;
      }

      // Create TeamMembership
      let teamMembership = await TeamMembership.findOne({
        userId: user._id,
        teamId,
      });
      if (teamMembership) {
        throw new ApiError("User is already a member of the team", 400);
      }
      teamMembership = await TeamMembership.create({
        orgId,
        teamId,
        userId: user._id,
        roleId: teamRoleId,
      });
      created.teamMembership = teamMembership._id;

      // Get data for return
      const teamMembershipWithRoles = await TeamMembership.find({
        userId: user._id,
      })
        .populate<{ roleId: IRole }>("roleId")
        .lean();

      const teamIds = teamMembershipWithRoles.map((tm) => tm.teamId.toString());

      const teams = await this.getTeams(teamIds);
      const teamMap = new Map(teams.map((t) => [t._id.toString(), t]));

      const tokenizedUser: ITokenizedUser = {
        sub: user._id.toString(),
        email: user.email,
        orgId: orgId.toString(),
      };

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

      const orgRole = await Role.findById(orgMembership.roleId);
      const orgPermissions = orgRole?.permissions || [];

      const provider = EntitlementsFactory.create();
      const entitlements: Entitlements = await provider.getForOrg(
        org._id.toString()
      );
      const returnableUser: IUserReturnable = {
        id: user._id.toString(),
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
        await OrgMembership.deleteOne({ _id: created.orgMembership });
      }
      if (created.teamMembership) {
        await TeamMembership.deleteOne({ _id: created.teamMembership });
      }
      if (created.user) {
        await User.findByIdAndDelete(created.user);
      }
      throw error;
    }
  };

  async login(loginData: LoginData): Promise<{
    tokenizedUser: ITokenizedUser;
    returnableUser: IUserReturnable;
  }> {
    const { email, password } = loginData;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError("Invalid email or password");
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new ApiError("Invalid email or password");
    }

    // Find OrgMembership
    const orgMembership = await OrgMembership.findOne({
      userId: user._id,
    }).lean();
    if (!orgMembership) {
      throw new ApiError("User is not part of any organization");
    }

    // Find org and roles
    let org = await Org.findById(orgMembership.orgId).lean();

    if (!org) {
      throw new ApiError("Organization not found");
    }

    // Update org entitlements
    const planKey = org.entitlements.plan;
    org = await Org.findOneAndUpdate(
      { _id: org._id },
      { $set: { entitlements: Plans[planKey] } },
      { new: true }
    );

    if (!org) {
      throw new ApiError("Organization entitlement error");
    }

    const orgRoles = await Role.findById(orgMembership.roleId).lean();

    // Get teams
    const teamMemberships = await TeamMembership.find({ userId: user._id })
      .populate<{ roleId: IRole }>("roleId")
      .lean();

    const teamIds = teamMemberships.map((tm) => tm.teamId.toString());

    const teams = await this.getTeams(teamIds);
    const teamMap = new Map(teams.map((t) => [t._id.toString(), t]));
    const returnableTeams = teamMemberships.map((tm) => {
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

    const tokenizedUser: ITokenizedUser = {
      sub: user._id.toString(),
      email: user.email,
      orgId: orgMembership.orgId.toString(),
    };

    const entitlements: Entitlements = await this.entitlementsProvider.getForOrg(
      org._id.toString()
    );

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

    return {
      tokenizedUser,
      returnableUser,
    };
  }

  async getTeamIds(userId: string): Promise<string[]> {
    const teamMemberships = await TeamMembership.find({ userId })
      .select("teamId")
      .lean();
    const teamIds = teamMemberships.map((t) => t.teamId.toString());
    return teamIds;
  }

  async getTeams(teamIds: string[]): Promise<ITeam[]> {
    const teams = await Team.find({ _id: { $in: teamIds } }).select(
      "_id, name"
    );
    return teams;
  }

  async cleanup() {
    await User.deleteMany({});
    await Role.deleteMany({});
    await Monitor.deleteMany({});
    await Check.deleteMany({});
    await NotificationChannel.deleteMany({});
    await this.jobQueue.flush();
  }

  async cleanMonitors() {
    await Monitor.deleteMany({});
    await Check.deleteMany({});
  }

  changePassword = async (
    userId: Types.ObjectId,
    newPassword: string
  ): Promise<boolean> => {
    try {
      const passwordHash = await hashPassword(newPassword);
      const result = await User.updateOne(
        { _id: userId },
        { $set: { passwordHash } }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      throw error;
    }
  };
}

export default AuthService;
