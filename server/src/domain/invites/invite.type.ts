import type { UserRole } from "@/domain/users/user.type.js";

export interface Invite {
	id: string;
	email: string;
	teamId: string;
	role: UserRole[];
	token: string;
	expiry: string;
	createdAt: string;
	updatedAt: string;
}

// The invite token is effectively a bearer credential for accepting the invite (anyone
// holding it can register as that invitee), so it's only ever returned from the
// endpoints that mint/resend a specific invite (getInviteToken, sendInviteEmail). Listing
// invites and changing their duration are team-wide admin views and must not leak other
// admins' outstanding invite tokens, so they return this token-less summary instead.
export type InviteSummary = Omit<Invite, "token">;
