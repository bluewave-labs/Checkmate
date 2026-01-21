import type { Team } from "@/types/index.js";
export interface ITeamsRepository {
	// create
	create(email: string): Promise<Team>;
	// fetch
	// update
	// delete
	// other
}
