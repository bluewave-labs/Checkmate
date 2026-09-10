import type { Invite } from "@/domain/invites/invite.type.js";

export interface IInvitesRepository {
	// create
	create(invite: Partial<Invite>): Promise<Invite>;
	// fetch
	findByToken(token: string): Promise<Invite>;
	findByTokenAndDelete(token: string): Promise<Invite>;
	findById(params: { id: string; teamId: string }): Promise<Invite>;
	findByTeamId(teamId: string): Promise<Invite[]>;
	// update
	updateExpiryById(params: { id: string; teamId: string; expiry: Date }): Promise<Invite>;
	// delete
	// other
}
