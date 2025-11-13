import mongoose from "mongoose";
import {
  ITeamMembership,
  TeamMembership,
  IUser,
  IRole,
  Role,
  Team,
  OrgMembership,
  IOrgMembership,
} from "@/db/models/index.js";
import ApiError from "@/utils/ApiError.js";

const SERVICE_NAME = "TeamMemberService";
export interface ITeamMemberService {
  create: (
    orgId: string,
    data: Partial<ITeamMembership>
  ) => Promise<ITeamMembership>;
  getAll: (
    orgId: string,
    teamId: string | undefined,
    type: string
  ) => Promise<Array<ITeamMembership | IOrgMembership>>;
  get: (orgId: string, teamMemberId: string) => Promise<ITeamMembership>;
  update: (
    orgId: string,
    teamMembershipId: string,
    roleId: string
  ) => Promise<ITeamMembership>;
  delete: (orgId: string, teamMemberId: string) => Promise<boolean>;
}

class TeamMemberService implements ITeamMemberService {
  public SERVICE_NAME: string;

  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
  }

  create = async (orgId: string, data: Partial<ITeamMembership>) => {
    const userId = data.userId?.toString();
    if (!userId) {
      throw new ApiError("User ID is required", 400);
    }

    const existing = await TeamMembership.findOne({
      teamId: data.teamId,
      userId: data.userId,
      orgId: orgId,
    });

    if (existing) {
      throw new ApiError("User is already a member of the team", 400);
    }

    const role = await Role.findOne({
      _id: data.roleId,
      organizationId: orgId,
    });
    if (!role) {
      throw new ApiError("Role not found", 404);
    }

    const tm = await TeamMembership.create({
      ...data,
      orgId: new mongoose.Types.ObjectId(orgId),
    });

    return tm;
  };

  getAll = async (orgId: string, teamId: string | undefined, type: string) => {
    if (type === "org") {
      return await OrgMembership.find({ orgId }).populate<IUser>(
        "userId",
        "firstName lastName email"
      );
    }

    if (!teamId) {
      return await TeamMembership.find({ orgId })
        .populate<IUser>("userId", "firstName lastName email")
        .populate<IRole>("roleId", "name scope permissions");
    }

    const team = await Team.findOne({ _id: teamId, orgId: orgId });
    if (!team) {
      throw new ApiError("Team not found", 404);
    }

    const teamMembers = await TeamMembership.find({ orgId, teamId })
      .populate<IUser>("userId", "firstName lastName email")
      .populate<IRole>("roleId", "name scope permissions");

    return teamMembers;
  };

  get = async (orgId: string, teamMemberId: string) => {
    const teamMember = await TeamMembership.findOne({
      _id: teamMemberId,
      orgId: orgId,
    })
      .populate<IUser>("userId", "firstName lastName email")
      .populate<IRole>("roleId", "name scope permissions");

    if (!teamMember) {
      throw new ApiError("Team member not found", 404);
    }

    return teamMember;
  };

  update = async (orgId: string, teamMembershipId: string, roleId: string) => {
    const role = await Role.findOne({ _id: roleId, organizationId: orgId });
    if (!role) {
      throw new ApiError("Role not found", 404);
    }

    const teamMembership = await TeamMembership.findOneAndUpdate(
      { orgId: orgId, _id: teamMembershipId },
      { roleId: roleId },
      { new: true }
    )
      .populate<IUser>("userId", "firstName lastName email")
      .populate<IRole>("roleId", "name scope permissions");

    if (!teamMembership) {
      throw new ApiError("Team membership not found", 404);
    }

    return teamMembership;
  };

  delete = async (orgId: string, teamMemberId: string) => {
    const tm = await TeamMembership.findOne({
      _id: teamMemberId,
      orgId: orgId,
    });
    if (!tm) {
      throw new ApiError("Team member not found", 404);
    }
    await TeamMembership.findOneAndDelete({ _id: teamMemberId, orgId: orgId });
    return true;
  };
}

export default TeamMemberService;
