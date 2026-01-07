import {
  TeamMembership,
  TeamMembershipWithDetails,
} from "@/types/domain/index.js";
export interface ITeamMembershipRepository {
  // create
  create(membership: Partial<TeamMembership>): Promise<TeamMembership>;
  // single fetch
  findByUserId(userId: string, teamId: string): Promise<TeamMembership | null>;
  findByUserIdWithRole(
    userId: string
  ): Promise<TeamMembershipWithDetails[] | null>;
  // collection fetch
  // update
  // delete
  deleteById(membershipId: string): Promise<boolean>;
}
