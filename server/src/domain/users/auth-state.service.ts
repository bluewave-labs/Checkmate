import type { IUsersRepository } from "@/domain/users/user.repository.interface.js";

export interface IAuthStateService {
	isTokenCurrent(userId: string, iat: number | undefined): Promise<boolean>;
	revokeTokens(userIds: string[]): Promise<void>;
}

const SERVICE_NAME = "AuthStateService";
const CACHE_TTL_MS = 60_000;

type AuthState = { isActive: boolean; tokensValidAfter: number | null };

// Decides whether a signed token still counts, from the user's deactivation flag and revocation cutoff.
// Reads are cached per user for 60 s, so a revocation or deactivation reaches other requests within a minute.
export class AuthStateService implements IAuthStateService {
	static SERVICE_NAME = SERVICE_NAME;

	private cache = new Map<string, { state: AuthState | null; expiresAt: number }>();

	constructor(
		private usersRepository: IUsersRepository,
		private now: () => number = () => Date.now()
	) {}

	private getState = async (userId: string): Promise<AuthState | null> => {
		const cached = this.cache.get(userId);
		if (cached && cached.expiresAt > this.now()) {
			return cached.state;
		}
		const state = await this.usersRepository.findAuthState(userId);
		this.cache.set(userId, { state, expiresAt: this.now() + CACHE_TTL_MS });
		return state;
	};

	isTokenCurrent = async (userId: string, iat: number | undefined) => {
		const state = await this.getState(userId);
		if (!state || !state.isActive) {
			return false;
		}
		// Equal seconds pass: a session issued in the same second as the revocation is valid
		if (state.tokensValidAfter !== null && (iat === undefined || iat < state.tokensValidAfter)) {
			return false;
		}
		return true;
	};

	revokeTokens = async (userIds: string[]) => {
		await this.usersRepository.setTokensValidAfter(userIds, Math.floor(this.now() / 1000));
		for (const id of userIds) {
			this.cache.delete(id);
		}
	};
}
