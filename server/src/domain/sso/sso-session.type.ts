export type SsoSession = {
	id: string;
	userId: string;
	tokenHash: string;
	// Epoch seconds, compared with the user's tokensValidAfter
	issuedAt: number;
	absoluteExpiresAt: Date;
	revokedAt: Date | null;
};
