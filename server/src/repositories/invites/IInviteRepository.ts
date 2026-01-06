import { Invite } from "@/types/domain/index.js";

export interface IInviteRepository {
  // create
  create(inviteData: Partial<Invite>): Promise<Invite | null>;
  // single fetch
  findByEmail(email: string, teamId: string): Promise<Invite | null>;
  findByHash(tokenHash: string): Promise<Invite | null>;
  // collection fetch
  findAll(): Promise<Invite[]>;
  // update
  // delete
  deleteById(id: string): Promise<boolean>;
}
