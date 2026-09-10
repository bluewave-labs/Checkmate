import type { UserRole } from "@/Types/User";

export interface Invite {
	id: string;
	email: string;
	teamId: string;
	role: UserRole[];
	expiry: string;
	createdAt: string;
	updatedAt: string;
}
