import { OrgMembership } from "@/types/domain/index.js";

export interface IOrgMembershipRepository {
  // create
  create(orgMembershipData: Partial<OrgMembership>): Promise<OrgMembership>;
  // single fetch
  findByUserId(userId: string): Promise<OrgMembership | null>;
  // collection fetch
  // update
  update(orgMembership: Partial<OrgMembership>): Promise<OrgMembership | null>;
  // delete
  deleteById(membershipId: string): Promise<boolean>;
}
