import { ConnectApiRejectedError, type IConnectApiService } from "@/domain/connect/connect-api.service.js";
import type { IConnectRepository } from "@/domain/connect/connect.repository.interface.js";
import type { ConnectEnrollment, ConnectSsoCheckResult, ConnectSsoConfig } from "@/domain/connect/connect.type.js";
import type { ISsoSessionRepository } from "@/domain/sso/sso-session.repository.interface.js";
import type { IAuthStateService } from "@/domain/users/auth-state.service.js";
import type { IUsersRepository } from "@/domain/users/user.repository.interface.js";
import type { User } from "@/domain/users/user.type.js";
import type { IEncryptionService } from "@/service/encryption/encryptionService.js";
import type { ILogger } from "@/utils/logger/logger.js";

const SERVICE_NAME = "SsoSyncService";

type SsoSyncOutcome = "synced" | "disabled" | "unreachable" | "unreadable";

const CHECK_INTERVAL_MS = 60 * 60 * 1000;
const CHECK_BATCH_SIZE = 50;
const UNLINKED_USERS_LIMIT = 500;

const subjectKey = (provider: string, tenant: string, subject: string) => JSON.stringify([provider, tenant, subject]);

const DISABLED_CONFIG: ConnectSsoConfig = { enabled: false, provider: null, label: null, enforce: false, graceUntil: null, startUrl: null };

export interface SsoSyncServiceDependencies {
	connectRepository: IConnectRepository;
	connectApiService: IConnectApiService;
	encryptionService: IEncryptionService;
	usersRepository: IUsersRepository;
	ssoSessionRepository: ISsoSessionRepository;
	authStateService: IAuthStateService;
	logger: ILogger;
	now?: () => Date;
}

export interface ISsoSyncService {
	handleJob(): Promise<void>;
}

export class SsoSyncService implements ISsoSyncService {
	static SERVICE_NAME = SERVICE_NAME;
	private logger: ILogger;
	private lastOutcome: SsoSyncOutcome | null = null;
	private connectRepository: IConnectRepository;
	private connectApiService: IConnectApiService;
	private encryptionService: IEncryptionService;
	private usersRepository: IUsersRepository;
	private ssoSessionRepository: ISsoSessionRepository;
	private authStateService: IAuthStateService;
	private lastCheckFailed = false;
	private now: () => Date;

	constructor(dependencies: SsoSyncServiceDependencies) {
		this.connectRepository = dependencies.connectRepository;
		this.connectApiService = dependencies.connectApiService;
		this.encryptionService = dependencies.encryptionService;
		this.usersRepository = dependencies.usersRepository;
		this.ssoSessionRepository = dependencies.ssoSessionRepository;
		this.authStateService = dependencies.authStateService;
		this.now = dependencies.now ?? (() => new Date());
		this.logger = dependencies.logger.child({ service: SERVICE_NAME });
	}

	private report = (outcome: SsoSyncOutcome, log: () => void) => {
		if (outcome !== this.lastOutcome) log();
		this.lastOutcome = outcome;
	};

	handleJob = async (): Promise<void> => {
		try {
			const { enrollment, sso } = await this.connectRepository.get();
			if (!enrollment) {
				this.lastOutcome = null;
				if (sso !== null) await this.connectRepository.setSsoState(null);
				return;
			}

			let token: string;
			try {
				token = this.encryptionService.decrypt(enrollment.token);
			} catch (error: unknown) {
				this.report("unreadable", () => this.logger.warn({ err: error }, "SSO sync paused: the stored credential can't be decrypted"));
				return;
			}

			let config: ConnectSsoConfig;
			try {
				config = await this.connectApiService.ssoConfig({ ...enrollment, token });
			} catch (error: unknown) {
				if (error instanceof ConnectApiRejectedError && error.status === 401) {
					await this.connectRepository.setSsoState({
						...DISABLED_CONFIG,
						fetchedAt: this.now().toISOString(),
						lastCheckRunAt: sso?.lastCheckRunAt ?? null,
					});
					this.report("disabled", () => this.logger.warn("SSO disabled: Connect rejected this installation's credentials"));
					return;
				}
				// Network failure, 503 unavailable or an unexpected body: keep the cached config
				this.report("unreachable", () => this.logger.warn({ err: error }, "SSO sync can't reach Connect, keeping the cached config"));
				return;
			}

			await this.connectRepository.setSsoState({ ...config, fetchedAt: this.now().toISOString(), lastCheckRunAt: sso?.lastCheckRunAt ?? null });
			this.report("synced", () => this.logger.info({ enabled: config.enabled }, "SSO config synced from Connect"));

			if (config.enabled && this.isCheckDue(sso?.lastCheckRunAt ?? null)) {
				await this.runCheck(enrollment, token);
			}
		} catch (error: unknown) {
			this.logger.warn({ err: error }, "SSO sync failed");
		}
	};
	// A missing or unreadable timestamp counts as due, so a bad value can't stop the check for good
	private isCheckDue = (lastCheckRunAt: string | null) => {
		if (lastCheckRunAt === null) return true;
		const elapsed = this.now().getTime() - Date.parse(lastCheckRunAt);
		return Number.isNaN(elapsed) || elapsed >= CHECK_INTERVAL_MS;
	};

	// Asks Connect whether each linked user may still sign in. Any failure ends the run without touching the
	// batch that failed and leaves lastCheckRunAt unset, so the next sync retries.
	runCheck = async (enrollment: ConnectEnrollment, token: string): Promise<void> => {
		try {
			const linked = await this.usersRepository.findSsoLinked();
			const usersByKey = new Map(linked.map((user) => [subjectKey(user.sso!.provider, user.sso!.tenant, user.sso!.subject), user]));
			const unlinkedPasswordUsers = await this.usersRepository.findUnlinkedPasswordUserEmails(UNLINKED_USERS_LIMIT);

			// The first request always goes out, even with no linked users, because it carries the unlinked list
			for (let start = 0; start === 0 || start < linked.length; start += CHECK_BATCH_SIZE) {
				const subjects = linked
					.slice(start, start + CHECK_BATCH_SIZE)
					.map(({ sso }) => ({ provider: sso!.provider, tenant: sso!.tenant, subject: sso!.subject }));
				const results = await this.connectApiService.ssoCheck(
					{ ...enrollment, token },
					start === 0 ? { subjects, unlinkedPasswordUsers } : { subjects }
				);
				for (const result of results) {
					const user = usersByKey.get(subjectKey(result.provider, result.tenant, result.subject));
					if (user) await this.applyResult(user, result);
				}
			}

			const { sso } = await this.connectRepository.get();
			if (sso) await this.connectRepository.setSsoState({ ...sso, lastCheckRunAt: this.now().toISOString() });
			this.lastCheckFailed = false;
		} catch (error: unknown) {
			if (error instanceof ConnectApiRejectedError && error.status === 403 && error.code === "sso_disabled") {
				await this.handleSsoDisabled();
				return;
			}
			if (!this.lastCheckFailed) this.logger.warn({ err: error }, "SSO offboarding check failed, will retry on the next sync");
			this.lastCheckFailed = true;
		}
	};

	// Seam for the lapse handler: Connect says SSO is off for this installation. For now the run just stops.
	private handleSsoDisabled = async (): Promise<void> => {};

	private applyResult = async (user: User, result: ConnectSsoCheckResult): Promise<void> => {
		if (result.status === "allowed") {
			const managedRole =
				result.roleManaged && result.role !== null && !(user.role.length === 1 && user.role[0] === result.role) ? result.role : undefined;
			await this.usersRepository.applySsoCheck(user.id, { lastCheckedAt: this.now().toISOString(), ...(managedRole ? { role: managedRole } : {}) });
			return;
		}
		// A user an admin already deactivated stays as is, so a later login can't mistake it for an SSO deactivation
		if (result.status === "denied" && user.isActive) {
			await this.authStateService.revokeTokens([user.id]);
			await this.ssoSessionRepository.revokeAllForUser(user.id);
			await this.usersRepository.applySsoCheck(user.id, { isActive: false, deactivatedBySso: true });
		}
	};
}
