import crypto from "node:crypto";
import {
  IInvite,
  Invite,
  User,
  IUser,
  Role,
  Team,
  TeamMembership,
} from "@/db/models/index.js";
import ApiError from "@/utils/ApiError.js";

const SERVICE_NAME = "InviteService";
export interface IInviteService {
  create: (
    userId: string,
    email: string,
    orgId: string,
    orgRoleId: string,
    teamId: string,
    teamRoleId: string
  ) => Promise<string>;
  getAll: () => Promise<IInvite[]>;
  get: (tokenHash: string) => Promise<{ user: IUser | null; invite: IInvite }>;
  delete: (id: string) => Promise<boolean>;
}

class InviteService implements IInviteService {
  public SERVICE_NAME: string;
  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
  }

  create = async (
    userId: string,
    email: string,
    orgId: string,
    orgRoleId: string,
    teamId: string,
    teamRoleId: string
  ) => {
    try {
      const role = await Role.findOne({
        _id: teamRoleId,
        organizationId: orgId,
      });

      if (!role) {
        throw new ApiError("Role not found", 404);
      }

      const team = await Team.findOne({
        _id: teamId,
        orgId,
      });

      if (!team) {
        throw new ApiError("Team not found", 404);
      }

      // Check if already a team member
      const user = await User.findOne({ email });
      const existingMembership = await TeamMembership.findOne({
        userId: user?._id,
        teamId,
      });

      if (existingMembership) {
        throw new ApiError("User is already a team member", 409);
      }

      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      const invite = await Invite.create({
        orgId,
        ...(orgRoleId && { orgRoleId }),
        teamId,
        teamRoleId,
        email,
        tokenHash,
        createdBy: userId,
        updatedBy: userId,
      });

      if (!invite) {
        throw new ApiError("Failed to create invite", 500);
      }
      return token;
    } catch (error: any) {
      throw error;
    }
  };

  get = async (token: string) => {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const invite = await Invite.findOne({ tokenHash });
    if (!invite) {
      throw new ApiError("Invite not found", 404);
    }
    const user = await User.findOne({ email: invite.email });
    return { user, invite };
  };

  getAll = async () => {
    return Invite.find();
  };

  delete = async (id: string) => {
    const result = await Invite.deleteOne({ _id: id });
    if (!result.deletedCount) {
      throw new ApiError("Invite not found", 404);
    }
    return result.deletedCount === 1;
  };
}

export default InviteService;
