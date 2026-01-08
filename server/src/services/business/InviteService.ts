import crypto from "node:crypto";
import ApiError from "@/utils/ApiError.js";
import type {
  IUserRepository,
  IRoleRepository,
  ITeamRepository,
  IInviteRepository,
  ITeamMembershipRepository,
} from "@/repositories/index.js";
import { User, Invite } from "@/types/domain/index.js";

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
  getAll: () => Promise<Invite[]>;
  get: (tokenHash: string) => Promise<{ user: User | null; invite: Invite }>;
  delete: (id: string) => Promise<boolean>;
}

class InviteService implements IInviteService {
  public SERVICE_NAME: string;
  private userRepository: IUserRepository;
  private roleRepository: IRoleRepository;
  private teamRepository: ITeamRepository;
  private inviteRepository: IInviteRepository;
  private teamMembershipRepository: ITeamMembershipRepository;
  constructor(
    userRepository: IUserRepository,
    roleRepository: IRoleRepository,
    teamRepository: ITeamRepository,
    inviteRepository: IInviteRepository,
    teamMembershipRepository: ITeamMembershipRepository
  ) {
    this.SERVICE_NAME = SERVICE_NAME;
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
    this.teamRepository = teamRepository;
    this.inviteRepository = inviteRepository;
    this.teamMembershipRepository = teamMembershipRepository;
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
      const role = await this.roleRepository.findByIdAndOrgId(
        teamRoleId,
        orgId
      );

      if (!role) {
        throw new ApiError("Role not found", 404);
      }

      const team = await this.teamRepository.findById(teamId, orgId);

      if (!team) {
        throw new ApiError("Team not found", 404);
      }

      // Check if already a team member
      const user = await this.userRepository.findByEmail(email);
      let existingMembership = null;
      if (user) {
        existingMembership = await this.teamMembershipRepository.findByUserId(
          user.id,
          teamId
        );
      }
      if (existingMembership) {
        throw new ApiError("User is already a team member", 409);
      }

      // Check if inivite already exists
      const existingInvite = await this.inviteRepository.findByEmail(
        email,
        teamId
      );

      if (existingInvite) {
        throw new ApiError("An invite already exists for this email", 409);
      }

      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      const invite = await this.inviteRepository.create({
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
    const invite = await this.inviteRepository.findByHash(tokenHash);
    if (!invite) {
      throw new ApiError("Invite not found", 404);
    }
    const user = await this.userRepository.findByEmail(invite.email);

    return { user, invite };
  };

  getAll = async () => {
    return await this.inviteRepository.findAll();
  };

  delete = async (id: string) => {
    return await this.inviteRepository.deleteById(id);
  };
}

export default InviteService;
