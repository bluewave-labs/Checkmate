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

const SERVICE_NAME = "AuthService";

export const PERMISSIONS = {
  users: {
    all: "users.*",
    write: "users.write",
    read: "users.read",
    delete: "users.delete",
  },

  monitors: {
    all: "monitors.*",
    write: "monitors.write",
    read: "monitors.read",
    update: "monitors.update",
    delete: "monitors.delete",
  },
  notifications: {
    all: "notifications.*",
    write: "notifications.write",
    read: "notifications.read",
    update: "notifications.update",
    delete: "notifications.delete",
  },
  maintenance: {
    all: "maintenance.*",
    write: "maintenance.write",
    read: "maintenance.read",
    update: "maintenance.update",
    delete: "maintenance.delete",
  },
  invite: {
    all: "invite.*",
    write: "invite.write",
    read: "invite.read",
    delete: "invite.delete",
  },
  checks: {
    all: "checks.*",
    write: "checks.write",
    read: "checks.read",
    update: "checks.update",
    delete: "checks.delete",
  },
  statusPages: {
    all: "statusPages.*",
    write: "statusPages.write",
    read: "statusPages.read",
    update: "statusPages.update",
    delete: "statusPages.delete",
  },
  teams: {
    all: "teams.*",
    write: "teams.write",
    read: "teams.read",
    update: "teams.update",
    delete: "teams.delete",
  },
  roles: {
    all: "roles.*",
    write: "roles.write",
    read: "roles.read",
    update: "roles.update",
    delete: "roles.delete",
  },

  diagnostic: {
    all: "diagnostic.*",
    write: "diagnostic.write",
    read: "diagnostic.read",
    update: "diagnostic.update",
    delete: "diagnostic.delete",
  },
  incidents: {
    all: "incidents.*",
    write: "incidents.write",
    read: "incidents.read",
    update: "incidents.update",
    delete: "incidents.delete",
  },
};

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
  constructor(jobQueue: IJobQueue) {
    this.SERVICE_NAME = SERVICE_NAME;
    this.jobQueue = jobQueue;
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

    const returnableUser: IUserReturnable = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      org: {
        name: org.name,
        permissions: orgRoles?.permissions || [],
      },
      teams: returnableTeams,
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

      const returnableUser: IUserReturnable = {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        org: {
          name: org.name,
          permissions: roles[0]?.permissions || [],
        },
        teams: [returnableTeam],
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

      const returnableUser: IUserReturnable = {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        org: {
          name: org.name,
          permissions: orgPermissions,
        },
        teams: returnableTeams,
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
    const org = await Org.findById(orgMembership.orgId).lean();

    if (!org) {
      throw new ApiError("Organization not found");
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

    const returnableUser: IUserReturnable = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      org: {
        name: org.name,
        permissions: orgRoles?.permissions || [],
      },
      teams: returnableTeams,
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
