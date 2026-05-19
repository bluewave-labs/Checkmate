import jwt from "jsonwebtoken";

export const UNLOCK_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
export const UNLOCK_COOKIE_PATH = "/api/v1/status-page";
export const UNLOCK_COOKIE_NAME_PREFIX = "checkmate_sp_";

export interface UnlockTokenClaims {
	kind: "statuspage";
	statusPageId: string;
	pv: number;
	iat?: number;
	exp?: number;
}

export interface UnlockTokenInput {
	statusPageId: string;
	passwordVersion: number;
}

export const buildCookieName = (statusPageId: string): string => `${UNLOCK_COOKIE_NAME_PREFIX}${statusPageId}`;

export const signUnlockToken = (input: UnlockTokenInput, secret: string): string => {
	const payload: Omit<UnlockTokenClaims, "iat" | "exp"> = {
		kind: "statuspage",
		statusPageId: input.statusPageId,
		pv: input.passwordVersion,
	};
	return jwt.sign(payload, secret, { expiresIn: UNLOCK_TOKEN_TTL_SECONDS });
};

export const verifyUnlockToken = (token: string, secret: string): UnlockTokenClaims | null => {
	try {
		const decoded = jwt.verify(token, secret) as Partial<UnlockTokenClaims> | string;
		if (typeof decoded !== "object" || decoded === null) return null;
		if (decoded.kind !== "statuspage") return null;
		if (!decoded.statusPageId || typeof decoded.pv !== "number") return null;
		return decoded as UnlockTokenClaims;
	} catch {
		return null;
	}
};
