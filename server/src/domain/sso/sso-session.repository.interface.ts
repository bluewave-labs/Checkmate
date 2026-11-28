import type { SsoSession } from "@/domain/sso/sso-session.type.js";

export interface ISsoSessionRepository {
	// create
	create(input: { userId: string; tokenHash: string; issuedAt: number; absoluteExpiresAt: Date }): Promise<SsoSession>;
	// fetch
	findActiveByHash(hash: string, now: Date): Promise<SsoSession | null>;
	// update
	rotate(id: string, newHash: string, issuedAt: number): Promise<void>;
	revoke(id: string): Promise<void>;
	revokeByHash(hash: string): Promise<void>;
	revokeAllForUser(userId: string): Promise<void>;
	revokeAll(): Promise<void>;
}
