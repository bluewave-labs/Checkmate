import type { SsoSession } from "@/domain/sso/sso-session.type.js";

export interface ISsoSessionRepository {
	// create
	create(input: { userId: string; tokenHash: string; issuedAt: number; absoluteExpiresAt: Date }): Promise<SsoSession>;
	// fetch
	findActiveByHash(hash: string, now: Date): Promise<SsoSession | null>;
	// update
	// Compare-and-swap: true only if the session still held oldHash and was active
	rotate(id: string, oldHash: string, newHash: string, issuedAt: number, now: Date): Promise<boolean>;
	revoke(id: string): Promise<void>;
	revokeByHash(hash: string): Promise<void>;
	revokeAllForUser(userId: string): Promise<void>;
	revokeAll(): Promise<void>;
}
