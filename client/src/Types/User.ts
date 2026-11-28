export const UserRoles = ["user", "admin", "superadmin", "demo"] as const;
export type UserRole = (typeof UserRoles)[number];

export interface UserProfileImage {
	data?: Buffer;
	contentType?: string;
}

export const SsoProviders = ["entra", "google"] as const;
export type SsoProvider = (typeof SsoProviders)[number];

export interface SsoLink {
	provider: SsoProvider;
	tenant: string;
	subject: string;
	roleManaged: boolean;
	lastCheckedAt: string | null;
	deactivatedBySso: boolean;
}

export interface User {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	avatarImage?: string;
	profileImage?: UserProfileImage;
	isActive: boolean;
	isVerified: boolean;
	role: UserRole[];
	teamId: string;
	checkTTL?: number;
	whatsNewSeen?: string;
	createdAt: string;
	updatedAt: string;
	sso?: SsoLink;
}

export interface AuthResponse {
	user: User;
	token: string;
}
