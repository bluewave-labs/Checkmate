import { type IInvite, Invite } from "@/db/models/index.js";
import type { IInviteRepository } from "@/repositories/index.js";
import { Invite as InviteEntity } from "@/types/domain/index.js";
import ApiError from "@/utils/ApiError.js";

class MongoInviteRepository implements IInviteRepository {
  private toEntity = (doc: IInvite): InviteEntity => {
    return {
      id: doc._id.toString(),
      orgId: doc.orgId.toString(),
      orgRoleId: doc.orgRoleId?.toString(),
      teamId: doc.teamId.toString(),
      teamRoleId: doc.teamRoleId.toString(),
      email: doc.email,
      tokenHash: doc.tokenHash,
      createdBy: doc.createdBy.toString(),
      updatedBy: doc.updatedBy.toString(),
      expiry: doc.expiry,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  };

  create = async (inviteData: Partial<InviteEntity>) => {
    const {
      orgId,
      orgRoleId,
      teamId,
      teamRoleId,
      email,
      tokenHash,
      createdBy,
      updatedBy,
    } = inviteData;
    const invite = await Invite.create({
      orgId,
      ...(orgRoleId && { orgRoleId }),
      teamId,
      teamRoleId,
      email,
      tokenHash,
      createdBy,
      updatedBy,
    });
    if (!invite) {
      return null;
    }
    return this.toEntity(invite);
  };

  findByEmail = async (email: string, teamId: string) => {
    const invite = await Invite.findOne({
      email,
      teamId,
    });
    if (!invite) {
      return null;
    }
    return this.toEntity(invite);
  };

  findByHash = async (tokenHash: string) => {
    const invite = await Invite.findOne({ tokenHash });
    if (!invite) return null;
    return this.toEntity(invite);
  };

  findAll = async () => {
    const invites = await Invite.find();
    return invites.map(this.toEntity);
  };
  deleteById = async (id: string) => {
    const result = await Invite.deleteOne({ _id: id });

    if (!result.deletedCount) {
      throw new ApiError("Invite not found", 404);
    }
    return result.deletedCount === 1;
  };
}

export default MongoInviteRepository;
