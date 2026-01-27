import type { UserRole } from "@/types/user.js";

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
