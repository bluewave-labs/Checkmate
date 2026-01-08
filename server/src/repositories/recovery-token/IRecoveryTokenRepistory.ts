import type { RecoveryToken } from "@/types/domain/index.js";

export interface IRecoveryTokenRepistory {
  // create
  create(userId: string, tokenHash: string): Promise<boolean>;
  // single fetch
  findByTokenHash(tokenHash: string): Promise<RecoveryToken | null>;
  // collection fetch
  // update
  // delete
  deleteByid(tokenId: string): Promise<boolean>;
}
