import { TeamMembership } from "@/types/domain/index.js";
export interface ITeamMembershipRepository {
  // create
  // single fetch
  findByUserId(userId: string, teamId: string): Promise<TeamMembership | null>;
  // collection fetch
  // update
  // delete
}
