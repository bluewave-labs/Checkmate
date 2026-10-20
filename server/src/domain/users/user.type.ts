import type { z } from "zod";
import type { userProfileImageSchema, userResponseSchema, userSchema } from "@/domain/users/user.schema.js";

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

export type UserProfileImage = z.infer<typeof userProfileImageSchema>;
export type User = z.infer<typeof userSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;

export const toUserResponse = ({
	password: _password,
	profileImage: _profileImage,
	ssoIssuer: _ssoIssuer,
	ssoSubject: _ssoSubject,
	...rest
}: User): UserResponse => rest;
