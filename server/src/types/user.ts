export const UserRoles = ["user", "admin", "superadmin", "demo"] as const;
export type UserRole = (typeof UserRoles)[number];

export const RoleHierarchy: Record<UserRole, number> = {
	demo: 0,
	user: 1,
	admin: 2,
	superadmin: 3,
};

export const canManageRole = (actorRole: UserRole, targetRole: UserRole): boolean => {
	return RoleHierarchy[actorRole] > RoleHierarchy[targetRole];
};

export interface UserProfileImage {
	data?: Buffer;
	contentType?: string;
}

export interface User {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	avatarImage?: string;
	profileImage?: UserProfileImage;
	isActive: boolean;
	isVerified: boolean;
	role: UserRole[];
	teamId: string;
	checkTTL?: number;
	createdAt: string;
	updatedAt: string;
}
