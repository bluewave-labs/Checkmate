import type { Invite } from "@/types/index.js";

export interface IInvitesRepository {
	// create
	// fetch
	findByTokenAndDelete(token: string): Promise<Invite>;
	// update

	// delete
	// other
}
