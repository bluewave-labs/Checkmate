import type { Team } from "@/domain/teams/team.type.js";
export interface ITeamsRepository {
	// create
	create(email: string): Promise<Team>;
	// fetch
	// update
	// delete
	// other
	findAllTeamIds(): Promise<string[]>;
}
