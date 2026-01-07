import { Team } from "@/types/domain/index.js";

export interface ITeamRepository {
  // create
  create(team: Partial<Team>): Promise<Team>;
  // single fetch
  findById(teamId: string, orgId: string): Promise<Team | null>;
  // collection fetch
  findManyById(teamIds: string[]): Promise<Team[]>;
  // update
  // delete
  deleteById(teamId: string): Promise<boolean>;
}
