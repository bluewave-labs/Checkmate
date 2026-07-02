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
