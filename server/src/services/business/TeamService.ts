import mongoose from "mongoose";
import {
  Monitor,
  Role,
  IRole,
  ITeam,
  Team,
  TeamMembership,
  OrgMembership,
  IUserContext,
} from "@/db/models/index.js";
import type { IJobQueue } from "../infrastructure/JobQueue.js";
import ApiError from "@/utils/ApiError.js";
import { PERMISSIONS } from "@/services/business/AuthService.js";

const SERVICE_NAME = "TeamService";
export interface ITeamService {
  create: (
    orgId: string,
    userId: string,
    teamData: ITeam,
    roleId: string
  ) => Promise<boolean>;
  getOrg: (orgId: string) => Promise<Partial<ITeam[]>>;
  getJoined: (teamId: string, orgId: string) => Promise<Partial<ITeam[]>>;
  get: (teamId: string, orgId: string) => Promise<ITeam>;
  update: (
    user: IUserContext,
    teamId: string,
    teamData: Partial<ITeam>
  ) => Promise<ITeam>;
  delete: (orgId: string, teamId: string) => Promise<boolean>;
}

class TeamService implements ITeamService {
  public SERVICE_NAME: string;
  private jobQueue: IJobQueue;

  constructor(jobQueue: IJobQueue) {
    this.SERVICE_NAME = SERVICE_NAME;
    this.jobQueue = jobQueue;
  }

  create = async (
    orgId: string,
    userId: string,
    teamData: ITeam,
    roleId: string
  ) => {
    const created: Record<string, any> = {
      team: null,
      memberships: null,
    };

    try {
      const teamLiteral: Partial<ITeam> = {
        name: teamData.name,
        description: teamData.description,
        orgId: new mongoose.Types.ObjectId(orgId),
      };

      // Check for roles
      const roles = await Role.find({ organizationId: orgId });

      if (!roles.some((r) => r._id.toString() === roleId)) {
        throw new Error("Role does not exist");
      }

      const team = await Team.create(teamLiteral);
      created.teamId = team._id;
      const membership = await TeamMembership.create({
        teamId: team._id,
        orgId: new mongoose.Types.ObjectId(orgId),
        userId: new mongoose.Types.ObjectId(userId),
        roleId: new mongoose.Types.ObjectId(roleId),
      });
      created.teamMembershipId = membership._id;

      return true;
    } catch (error) {
      await Team.deleteOne({ _id: created.teamId });
      await TeamMembership.deleteOne({ _id: created.teamMembershipId });
      throw error;
    }
  };

  getOrg = async (orgId: string) => {
    const teams = await Team.find({ orgId }).select("_id name description");
    return teams;
  };

  getJoined = async (orgId: string, userId: string) => {
    const teamMemberships = await TeamMembership.find({
      orgId,
      userId,
    }).select("teamId");

    const teamIds = teamMemberships.map((tm) => tm.teamId);

    const teams = await Team.find({ _id: { $in: teamIds }, orgId }).select(
      "_id name description"
    );
    return teams;
  };

  get = async (teamId: string, orgId: string) => {
    const team = await Team.findOne({ _id: teamId, orgId });
    if (!team) {
      throw new ApiError("Team not found");
    }
    return team;
  };

  update = async (
    user: IUserContext,
    teamId: string,
    teamData: Partial<ITeam>
  ) => {
    const updatedTeam = await Team.findOneAndUpdate(
      { _id: teamId, orgId: user.orgId },
      {
        $set: {
          ...teamData,
          updatedAt: new Date(),
          updatedBy: user.sub,
        },
      },
      { new: true, runValidators: true }
    );
    if (!updatedTeam) {
      throw new ApiError("Team not found");
    }

    return updatedTeam;
  };

  delete = async (orgId: string, teamId: string) => {
    const team = await Team.findOne({ _id: teamId, orgId }).lean();
    if (!team) {
      throw new ApiError("Team not found");
    }

    if (team.isSystem) {
      throw new ApiError("Cannot delete your default team");
    }

    const memberships = await TeamMembership.find({ teamId });
    for (const membership of memberships) {
      await membership.deleteOne();
    }

    const monitors = await Monitor.find({ teamId });
    await Promise.all(
      monitors.map((monitor) => this.jobQueue.deleteJob(monitor))
    );

    await Monitor.deleteMany({ teamId });
    await Team.deleteOne({ _id: teamId });
    return true;
  };
}

export default TeamService;
