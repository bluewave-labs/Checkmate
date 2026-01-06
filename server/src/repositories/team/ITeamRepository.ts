import { Team } from "@/types/domain/index.js";

export interface ITeamRepository {
  // create
  // single fetch
  findById(teamId: string, orgId: string): Promise<Team | null>;
  // collection fetch
  // update
  // delete
}
