import type { Team } from "@/domain/teams/team.type.js";
export interface ITeamsRepository {
	// create
	create(email: string): Promise<Team>;
	// fetch
	// update
	// delete
	// other
	findAllTeamIds(): Promise<string[]>;
	setHeartbeatKey(teamId: string, hash: string, userId: string): Promise<void>;
	findByHeartbeatKeyHash(hash: string): Promise<Team | null>;
	hasHeartbeatKey(teamId: string): Promise<boolean>;
}
