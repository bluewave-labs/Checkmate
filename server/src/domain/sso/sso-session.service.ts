import crypto from "crypto";
import jwt from "jsonwebtoken";
import type { ISsoSessionRepository } from "@/domain/sso/sso-session.repository.interface.js";
import type { IUsersRepository } from "@/domain/users/user.repository.interface.js";
import type { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import type { UserResponse } from "@/domain/users/user.type.js";
import { ssoErrors } from "@/domain/sso/sso.errors.js";
import { AppError } from "@/utils/AppError.js";

export interface ISsoSessionService {
	startSession(user: UserResponse): Promise<{ token: string; refreshToken: string }>;
	refresh(refreshToken: string): Promise<{ user: UserResponse; token: string; refreshToken: string }>;
	logout(refreshToken: string): Promise<void>;
	revokeAllForUser(userId: string): Promise<void>;
	revokeAll(): Promise<void>;
}

const SERVICE_NAME = "SsoSessionService";
const ACCESS_TOKEN_TTL = "15m";
const SESSION_MAX_MS = 30 * 24 * 60 * 60 * 1000;
const STALE_CHECK_MS = 24 * 60 * 60 * 1000;

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");
const newRefreshToken = () => crypto.randomBytes(32).toString("base64url");

// Long-lived SSO sessions behind a short access JWT. The refresh token is opaque, stored hashed, and rotated on every use.
// A session ends when it is revoked, its 30 day cap passes, or the user stops being a valid SSO user (inactive, unlinked, revoked, unchecked for 24 h).
export class SsoSessionService implements ISsoSessionService {
	static SERVICE_NAME = SERVICE_NAME;

	constructor(
		private ssoSessionsRepository: ISsoSessionRepository,
		private usersRepository: IUsersRepository,
		private settingsService: ISettingsService,
		private now: () => number = () => Date.now()
	) {}

	private issueAccessToken = (user: UserResponse) => {
		return jwt.sign({ ...user, avatarImage: "" }, this.settingsService.getSettings().jwtSecret, { expiresIn: ACCESS_TOKEN_TTL });
	};

	startSession = async (user: UserResponse) => {
		const refreshToken = newRefreshToken();
		await this.ssoSessionsRepository.create({
			userId: user.id,
			tokenHash: hashToken(refreshToken),
			issuedAt: Math.floor(this.now() / 1000),
			absoluteExpiresAt: new Date(this.now() + SESSION_MAX_MS),
		});
		return { token: this.issueAccessToken(user), refreshToken };
	};

	refresh = async (refreshToken: string) => {
		const session = await this.ssoSessionsRepository.findActiveByHash(hashToken(refreshToken), new Date(this.now()));
		if (!session) {
			throw new AppError(ssoErrors.sessionInvalid, { service: SERVICE_NAME });
		}

		const [authState, user] = await Promise.all([
			this.usersRepository.findAuthState(session.userId),
			this.usersRepository.findById(session.userId).catch(() => null),
		]);
		const lastCheckedAt = user?.sso?.lastCheckedAt ? Date.parse(user.sso.lastCheckedAt) : null;
		const valid =
			user?.sso !== undefined &&
			authState?.isActive === true &&
			(authState.tokensValidAfter === null || session.issuedAt >= authState.tokensValidAfter) &&
			lastCheckedAt !== null &&
			this.now() - lastCheckedAt <= STALE_CHECK_MS;
		if (!user || !valid) {
			await this.ssoSessionsRepository.revoke(session.id);
			throw new AppError(ssoErrors.sessionInvalid, { service: SERVICE_NAME });
		}

		const rotated = newRefreshToken();
		await this.ssoSessionsRepository.rotate(session.id, hashToken(rotated), Math.floor(this.now() / 1000));
		return { user, token: this.issueAccessToken(user), refreshToken: rotated };
	};

	logout = async (refreshToken: string) => {
		try {
			await this.ssoSessionsRepository.revokeByHash(hashToken(refreshToken));
		} catch {
			// Logging out never fails: the client discards its tokens either way
		}
	};

	revokeAllForUser = async (userId: string) => {
		await this.ssoSessionsRepository.revokeAllForUser(userId);
	};

	revokeAll = async () => {
		await this.ssoSessionsRepository.revokeAll();
	};
}
