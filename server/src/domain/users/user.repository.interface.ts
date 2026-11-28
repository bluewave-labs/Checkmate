import type { SsoProvider, SsoRole } from "@/domain/sso/sso.type.js";
import type { SsoLink, User, UserResponse } from "@/domain/users/user.type.js";
export interface IUsersRepository {
	// create
	create(user: Partial<User>, imageFile?: Express.Multer.File | null): Promise<UserResponse>;
	// fetch
	findByEmail(email: string): Promise<User>;
	findByEmailOrNull(email: string): Promise<User | null>;
	findBySsoIdentity(provider: SsoProvider, tenant: string, subject: string): Promise<User | null>;
	findById(id: string): Promise<UserResponse>;
	findAll(): Promise<UserResponse[]>;
	// Returns the id only if the user exists and belongs to the team
	findIdInTeam(userId: string, teamId: string): Promise<string | null>;
	findSuperAdminIdByTeamId(teamId: string): Promise<string | null>;
	findSuperadminTeamId(): Promise<string | null>;
	// update
	updateById(id: string, patch: Partial<User>, file?: Express.Multer.File | null): Promise<UserResponse>;
	setSso(userId: string, sso: SsoLink): Promise<UserResponse>;
	// One write for a single sign-on login: profile, link, and optionally email, role and reactivation
	updateFromSso(
		userId: string,
		patch: { firstName: string; lastName: string; email?: string; role?: SsoRole; sso: SsoLink; isActive?: boolean }
	): Promise<UserResponse>;
	// delete
	deleteById(id: string): Promise<User>;
	// Auth state read on every authenticated request; null when the user does not exist
	findAuthState(id: string): Promise<{ isActive: boolean; tokensValidAfter: number | null } | null>;
	setTokensValidAfter(ids: string[], seconds: number): Promise<void>;
	// other
	findSuperAdmin(): Promise<boolean>;
}
