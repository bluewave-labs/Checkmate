import crypto from "crypto";
import { ConnectApiRejectedError, type IConnectApiService } from "@/domain/connect/connect-api.service.js";
import { connectErrors } from "@/domain/connect/connect.errors.js";
import type { IConnectRepository } from "@/domain/connect/connect.repository.interface.js";
import type { ConnectEnrollment, ConnectSsoIdentity, ConnectSsoState } from "@/domain/connect/connect.type.js";
import type { ISsoLoginStateRepository } from "@/domain/sso/sso-login-state.repository.interface.js";
import type { ISsoSessionService } from "@/domain/sso/sso-session.service.js";
import { ssoErrors } from "@/domain/sso/sso.errors.js";
import type { SsoProvider } from "@/domain/sso/sso.type.js";
import type { IAuthStateService } from "@/domain/users/auth-state.service.js";
import { userErrors } from "@/domain/users/user.errors.js";
import type { IUsersRepository } from "@/domain/users/user.repository.interface.js";
import type { SsoLink, User, UserResponse } from "@/domain/users/user.type.js";
import type { IEncryptionService } from "@/service/encryption/encryptionService.js";
import { AppError } from "@/utils/AppError.js";

export interface ISsoLoginService {
	status(): Promise<{ enabled: boolean; provider: SsoProvider | null; label: string | null; enforce: boolean }>;
	start(returnOrigin: string): Promise<{ redirectUrl: string; state: string }>;
	redeem(code: string, state: string): Promise<{ user: UserResponse; token: string; refreshToken: string }>;
}

const SERVICE_NAME = "SsoLoginService";
const STATE_TTL_MS = 10 * 60 * 1000;
// Roles that never sign in through SSO
const PASSWORD_ONLY_ROLES = ["superadmin", "demo"];

const isPasswordOnly = (user: User) => user.role.some((role) => PASSWORD_ONLY_ROLES.includes(role));
// Mongoose requires non-empty names, and an IdP can omit them
const nameOr = (value: string, fallback: string) => (value.trim() === "" ? fallback : value);

// Signs users in with the single-use code Connect hands the browser after the IdP login.
// The code is redeemed server to server, so the browser never carries an identity the instance has to trust.
export class SsoLoginService implements ISsoLoginService {
	static SERVICE_NAME = SERVICE_NAME;

	constructor(
		private ssoLoginStateRepository: ISsoLoginStateRepository,
		private usersRepository: IUsersRepository,
		private connectRepository: IConnectRepository,
		private connectApiService: IConnectApiService,
		private encryptionService: IEncryptionService,
		private authStateService: IAuthStateService,
		private ssoSessionService: ISsoSessionService,
		private now: () => number = () => Date.now()
	) {}

	// Enrolled with SSO switched on, or null
	private getEnabled = async (): Promise<{ enrollment: ConnectEnrollment; sso: ConnectSsoState } | null> => {
		const { enrollment, sso } = await this.connectRepository.get();
		return enrollment && sso?.enabled ? { enrollment, sso } : null;
	};

	status = async () => {
		const enabled = await this.getEnabled();
		return {
			enabled: enabled !== null,
			provider: enabled?.sso.provider ?? null,
			label: enabled?.sso.label ?? null,
			enforce: enabled?.sso.enforce ?? false,
		};
	};

	start = async (returnOrigin: string) => {
		let origin: string | null = null;
		try {
			const url = new URL(returnOrigin);
			origin = url.origin;
			if (!["http:", "https:"].includes(url.protocol)) origin = null;
		} catch {
			// not a URL
		}
		if (origin === null || origin !== returnOrigin) {
			throw new AppError(ssoErrors.invalidReturnOrigin, { service: SERVICE_NAME });
		}
		const enabled = await this.getEnabled();
		if (!enabled || !enabled.sso.startUrl) {
			throw new AppError(ssoErrors.disabled, { service: SERVICE_NAME });
		}

		const state = crypto.randomBytes(32).toString("base64url");
		await this.ssoLoginStateRepository.create(state, returnOrigin, new Date(this.now() + STATE_TTL_MS));
		const redirectUrl = `${enabled.sso.startUrl}?agentId=${enabled.enrollment.agentId}&state=${state}&return=${encodeURIComponent(returnOrigin)}`;
		return { redirectUrl, state };
	};

	private redeemIdentity = async (code: string, state: string): Promise<ConnectSsoIdentity> => {
		const enabled = await this.getEnabled();
		if (!enabled) {
			throw new AppError(ssoErrors.disabled, { service: SERVICE_NAME });
		}
		try {
			const token = this.encryptionService.decrypt(enabled.enrollment.token);
			return await this.connectApiService.ssoRedeem({ ...enabled.enrollment, token }, { code, state });
		} catch (error: unknown) {
			if (error instanceof ConnectApiRejectedError && error.status === 404) {
				throw new AppError(ssoErrors.codeInvalid, { service: SERVICE_NAME });
			}
			if (error instanceof ConnectApiRejectedError && error.status === 403) {
				throw new AppError(ssoErrors.disabled, { service: SERVICE_NAME });
			}
			// Network failure, 503 unavailable, an unreadable credential or an unexpected body
			throw new AppError(connectErrors.connectUnreachable, {
				service: SERVICE_NAME,
				details: { cause: error instanceof Error ? error.message : String(error) },
			});
		}
	};

	// `findAuthState` is the source of truth for activity: `toEntity` maps a missing isActive to false
	private isActive = async (userId: string) => (await this.usersRepository.findAuthState(userId))?.isActive === true;

	private linkFor = (identity: ConnectSsoIdentity): SsoLink => ({
		provider: identity.provider,
		tenant: identity.tenant,
		subject: identity.subject,
		roleManaged: identity.roleManaged,
		lastCheckedAt: new Date(this.now()).toISOString(),
		deactivatedBySso: false,
	});

	private signInLinked = async (user: User, identity: ConnectSsoIdentity, email: string) => {
		if (isPasswordOnly(user)) {
			throw new AppError(ssoErrors.superadminNotAllowed, { service: SERVICE_NAME });
		}
		const active = await this.isActive(user.id);
		if (!active && !user.sso?.deactivatedBySso) {
			throw new AppError(userErrors.accountInactive, { service: SERVICE_NAME });
		}
		const holder = await this.usersRepository.findByEmailOrNull(email);
		return this.usersRepository.updateFromSso(user.id, {
			firstName: nameOr(identity.firstName, user.firstName),
			lastName: nameOr(identity.lastName, user.lastName),
			...(holder === null || holder.id === user.id ? { email } : {}),
			...(identity.roleManaged ? { role: identity.role } : {}),
			sso: this.linkFor(identity),
			...(active ? {} : { isActive: true }),
		});
	};

	private linkByEmail = async (user: User, identity: ConnectSsoIdentity) => {
		if (isPasswordOnly(user)) {
			throw new AppError(ssoErrors.superadminNotAllowed, { service: SERVICE_NAME });
		}
		// Never overwrite a link to another identity
		if (user.sso) {
			throw new AppError(ssoErrors.accountConflict, { service: SERVICE_NAME });
		}
		// Only a linked user deactivated by the SSO check is reactivated here
		if (!(await this.isActive(user.id))) {
			throw new AppError(userErrors.accountInactive, { service: SERVICE_NAME });
		}
		// The write only matches an unlinked user, so a concurrent login can't overwrite a link made since the read above
		const linked = await this.usersRepository.linkSso(user.id, {
			firstName: user.firstName,
			lastName: user.lastName,
			...(identity.roleManaged ? { role: identity.role } : {}),
			sso: this.linkFor(identity),
		});
		if (!linked) {
			throw new AppError(ssoErrors.accountConflict, { service: SERVICE_NAME });
		}
		// Sessions from before the link must not outlive it
		await this.authStateService.revokeTokens([user.id]);
		return linked;
	};

	private createUser = async (identity: ConnectSsoIdentity, email: string) => {
		const teamId = await this.usersRepository.findSuperadminTeamId();
		if (!teamId) {
			throw new AppError(ssoErrors.notSetUp, { service: SERVICE_NAME });
		}
		return this.usersRepository.create({
			firstName: nameOr(identity.firstName, email.split("@")[0] ?? email),
			lastName: nameOr(identity.lastName, "-"),
			email,
			teamId,
			role: [identity.role],
			isVerified: true,
			sso: this.linkFor(identity),
		});
	};

	redeem = async (code: string, state: string) => {
		// Consume first: a bad or reused state never reaches Connect
		if (!(await this.ssoLoginStateRepository.consume(state, new Date(this.now())))) {
			throw new AppError(ssoErrors.stateInvalid, { service: SERVICE_NAME });
		}
		const identity = await this.redeemIdentity(code, state);
		// Emails are stored lowercased, like the login lookup expects
		const email = identity.email.toLowerCase();

		const linked = await this.usersRepository.findBySsoIdentity(identity.provider, identity.tenant, identity.subject);
		const byEmail = linked ? null : await this.usersRepository.findByEmailOrNull(email);
		const user = linked
			? await this.signInLinked(linked, identity, email)
			: byEmail
				? await this.linkByEmail(byEmail, identity)
				: await this.createUser(identity, email);

		const session = await this.ssoSessionService.startSession(user);
		return { user, ...session };
	};
}
