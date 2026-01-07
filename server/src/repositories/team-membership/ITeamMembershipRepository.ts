import { TeamMembership } from "@/types/domain/index.js";
export interface ITeamMembershipRepository {
  // create
  create(membership: Partial<TeamMembership>): Promise<TeamMembership>;
  // single fetch
  findByUserId(userId: string, teamId: string): Promise<TeamMembership | null>;
  // collection fetch
  // update
  // delete
}
