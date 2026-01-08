import { type IRecoveryToken, RecoveryToken } from "@/db/models/index.js";
import type { RecoveryToken as RecoveryTokenEntity } from "@/types/domain/index.js";

import { IRecoveryTokenRepistory } from "@/repositories/index.js";

class MongoRecoveryTokenRepository implements IRecoveryTokenRepistory {
  private toEntity = (doc: IRecoveryToken): RecoveryTokenEntity => {
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      tokenHash: doc.tokenHash,
      expiry: doc.expiry,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  };
  create = async (userId: string, tokenHash: string) => {
    const recoveryToken = await RecoveryToken.create({
      userId,
      tokenHash,
    });
    if (!recoveryToken) return false;
    return true;
  };

  findByTokenHash = async (tokenHash: string) => {
    const recoveryToken = await RecoveryToken.findOne({ tokenHash });
    if (!recoveryToken) return null;
    return this.toEntity(recoveryToken);
  };

  deleteByid = async (tokenId: string) => {
    const result = await RecoveryToken.deleteOne({ _id: tokenId });
    return result.deletedCount === 1;
  };
}

export default MongoRecoveryTokenRepository;
