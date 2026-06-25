import type { Invite } from "@/domain/invites/invite.type.js";

export interface IInvitesRepository {
	// create
	create(invite: Partial<Invite>): Promise<Invite>;
	// fetch
	findByToken(token: string): Promise<Invite>;
	findByTokenAndDelete(token: string): Promise<Invite>;
	// update

	// delete
	// other
}
