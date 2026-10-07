import { ISettingsRepository } from "@/domain/app-settings/app-settings-repository.interface.js";
import { IInvitesRepository } from "@/domain/invites/invite.repository.interface.js";
import { IRecoveryTokensRepository } from "@/domain/recovery-tokens/recovery-token.repository.interface.js";
import { ITeamsRepository } from "@/domain/teams/team.repository.interface.js";
import { IUsersRepository } from "@/domain/users/user.repository.interface.js";
import { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";
import type { User, UserResponse } from "@/domain/users/user.type.js";
import { canManageRole, toUserResponse, type UserRole } from "@/domain/users/user.type.js";
import bcrypt from "bcryptjs";
import { AppError } from "@/utils/AppError.js";
import { IEmailService } from "@/service/emailService.js";
import { EnvConfig, ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import { ILogger } from "@/utils/logger.js";
import { IJobScheduler } from "@/worker/worker.interface.js";
import jwt from "jsonwebtoken";
import type { SsoClaims, SsoErrorCode } from "@/types/sso.js";
import crypto from "crypto";
type CryptoType = typeof crypto;
type JwtType = typeof jwt;
const SERVICE_NAME = "userService";

export interface IUserService {
	issueToken(payload: Partial<User>, appSettings: EnvConfig): string;
	registerUser(user: Partial<User>, inviteToken: string, file: Express.Multer.File | null): Promise<{ user: UserResponse; token: string }>;
	createUser(userData: Partial<User>, teamId: string, actorRoles: UserRole[], file: Express.Multer.File | null): Promise<UserResponse>;
	loginUser(email: string, password: string): Promise<{ user: UserResponse; token: string }>;
	loginWithSso(claims: SsoClaims): Promise<{ user: UserResponse; token: string }>;
	editUser(
		updates: Partial<User & { newPassword?: string; deleteProfileImage?: boolean }>,
		file: Express.Multer.File | null,
		currentUserId: string,
		currentUserEmail: string
	): Promise<UserResponse>;
	checkSuperadminExists(): Promise<boolean>;
	requestRecovery(email: string): Promise<string>;
	validateRecovery(recoveryToken: string): Promise<void>;
	resetPassword(password: string, recoveryToken: string): Promise<{ user: UserResponse; token: string }>;
	deleteUser(params: { userId: string; teamId: string; roles: UserRole[] }): Promise<void>;
	deleteUserById(params: { actorId: string; actorTeamId: string; actorRoles: UserRole[]; targetUserId: string }): Promise<void>;
	getAllUsers(): Promise<UserResponse[]>;
	getUserById(roles: UserRole[], userId: string): Promise<UserResponse>;
	editUserById(userId: string, patch: Partial<User>): Promise<void>;
	setPasswordByUserId(userId: string, password: string): Promise<UserResponse>;
}

export class UserService implements IUserService {
	static SERVICE_NAME = SERVICE_NAME;

	private hashPassword = (password: string): string => {
		const salt = bcrypt.genSaltSync(10);
		return bcrypt.hashSync(password, salt);
	};

	// Enforced here rather than on each route: every password-based entry point already funnels
	// through this service, so one guard covers login, recovery and registration together.
	// 403 rather than 401 outside the login page, because the client hard-redirects to /login on a 401.
	private assertLocalLoginEnabled = (method: string, status = 403): void => {
		const oidc = this.settingsService.getOidcConfig();
		if (oidc && !oidc.allowLocalLogin) {
			throw new AppError({
				message: "Password sign-in is disabled on this instance; use single sign-on",
				service: SERVICE_NAME,
				method,
				status,
			});
		}
	};

	// SSO-only accounts have no password hash. Every local-password path has to reject them here,
	// or bcrypt.compare is handed undefined and surfaces a library error as a 500.
	private requirePasswordHash = (user: User, method: string, status: number): string => {
		if (!user.password) {
			throw new AppError({ message: "This account signs in with single sign-on", service: SERVICE_NAME, method, status });
		}
		return user.password;
	};

	private emailService: IEmailService;
	private settingsService: ISettingsService;
	private logger: ILogger;
	private jwt: JwtType;
	private scheduler: IJobScheduler;
	private crypto: CryptoType;
	private monitorsRepository: IMonitorsRepository;
	private usersRepository: IUsersRepository;
	private invitesRepository: IInvitesRepository;
	private recoveryTokensRepository: IRecoveryTokensRepository;
	private settingsRepository: ISettingsRepository;
	private teamsRepository: ITeamsRepository;

	constructor({
		crypto,
		emailService,
		settingsService,
		logger,
		jwt,
		scheduler,
		monitorsRepository,
		usersRepository,
		invitesRepository,
		recoveryTokensRepository,
		settingsRepository,
		teamsRepository,
	}: {
		crypto: CryptoType;
		emailService: IEmailService;
		settingsService: ISettingsService;
		logger: ILogger;
		jwt: JwtType;
		scheduler: IJobScheduler;
		monitorsRepository: IMonitorsRepository;
		usersRepository: IUsersRepository;
		invitesRepository: IInvitesRepository;
		recoveryTokensRepository: IRecoveryTokensRepository;
		settingsRepository: ISettingsRepository;
		teamsRepository: ITeamsRepository;
	}) {
		this.emailService = emailService;
		this.settingsService = settingsService;
		this.logger = logger;
		this.jwt = jwt;
		this.scheduler = scheduler;
		this.crypto = crypto;
		this.monitorsRepository = monitorsRepository;
		this.usersRepository = usersRepository;
		this.invitesRepository = invitesRepository;
		this.recoveryTokensRepository = recoveryTokensRepository;
		this.settingsRepository = settingsRepository;
		this.teamsRepository = teamsRepository;
	}

	issueToken = (payload: Partial<User>, appSettings: EnvConfig) => {
		return this.jwt.sign(payload, appSettings.jwtSecret, { expiresIn: appSettings.jwtTTL });
	};

	registerUser = async (user: Partial<User>, inviteToken: string, file: Express.Multer.File | null) => {
		// Create a new user
		// If superAdmin exists, a token should be attached to all further register requests
		const superAdminExists = await this.usersRepository.findSuperAdmin();
		if (superAdminExists) {
			// First-run registration stays open even with password sign-in disabled, otherwise an
			// instance configured for SSO from the start could never be set up at all.
			this.assertLocalLoginEnabled("registerUser");
			const invite = await this.invitesRepository.findByTokenAndDelete(inviteToken);
			user.role = invite.role ?? ["user"];
			user.teamId = invite.teamId;
			user.email = invite.email;
		} else {
			// This is the first account, create JWT secret to use if one is not supplied by env
			const jwtSecret = this.crypto.randomBytes(64).toString("hex");
			await this.settingsRepository.update({ jwtSecret });
			// Create a new team
			if (!user.email) {
				throw new AppError({ message: "Email is required for first user", service: SERVICE_NAME, method: "registerUser", status: 400 });
			}
			const team = await this.teamsRepository.create(user.email);
			user.teamId = team.id;
			user.role = ["superadmin"];
		}

		// Hash password before storing
		if (user.password) {
			user.password = this.hashPassword(user.password);
		}

		const newUser = await this.usersRepository.create(user as User, file);

		this.logger.debug({
			message: "New user created",
			service: SERVICE_NAME,
			method: "registerUser",
			details: { userId: newUser.id },
		});

		delete newUser.avatarImage;

		const appSettings = await this.settingsService.getSettings();

		const token = this.issueToken(newUser, appSettings);

		try {
			const html = await this.emailService.buildEmail("welcomeEmailTemplate", {
				name: newUser.firstName,
			});
			if (!html) {
				throw new Error("Failed to build welcome email HTML");
			}
			this.emailService.sendEmail(newUser.email, "Welcome to Uptime Monitor", html).catch((error: unknown) => {
				this.logger.warn({
					message: error instanceof Error ? error.message : "Unknown error",
					service: SERVICE_NAME,
					method: "registerUser",
					stack: error instanceof Error ? error.stack : undefined,
				});
			});
		} catch (error: unknown) {
			this.logger.warn({
				message: error instanceof Error ? error.message : "Unknown error",
				service: SERVICE_NAME,
				method: "registerUser",
				stack: error instanceof Error ? error.stack : undefined,
			});
		}

		return { user: newUser, token };
	};

	createUser = async (userData: Partial<User>, teamId: string, actorRoles: UserRole[], file: Express.Multer.File | null) => {
		if (userData.password) {
			this.assertLocalLoginEnabled("createUser");
		}
		// Validate that the creator can assign the requested roles
		const targetRoles = userData.role ?? [];
		for (const targetRole of targetRoles) {
			const canManage = actorRoles.some((actorRole) => canManageRole(actorRole, targetRole));
			if (!canManage) {
				throw new AppError({
					message: "You do not have permission to assign this role",
					service: SERVICE_NAME,
					method: "createUser",
					status: 403,
				});
			}
		}

		userData.teamId = teamId;

		if (userData.password) {
			userData.password = this.hashPassword(userData.password);
		}

		const newUser = await this.usersRepository.create(userData as User, file);

		this.logger.debug({
			message: "New user created by superadmin",
			service: SERVICE_NAME,
			method: "createUser",
			details: { userId: newUser.id },
		});

		newUser.avatarImage = undefined;

		return newUser;
	};

	loginUser = async (email: string, password: string) => {
		this.assertLocalLoginEnabled("loginUser", 401);
		// Check if user exists
		const user = await this.usersRepository.findByEmail(email);
		// Compare password
		const match = await bcrypt.compare(password, this.requirePasswordHash(user, "loginUser", 401));

		if (match !== true) {
			throw new AppError({ message: "Incorrect password", service: SERVICE_NAME, status: 401 });
		}

		const userResponse = toUserResponse(user);

		// Happy path, return token
		const appSettings = await this.settingsService.getSettings();
		const token = this.issueToken({ ...userResponse, avatarImage: "" }, appSettings);
		return { user: userResponse, token };
	};

	// Resolution order: a previously linked provider subject, then a matching account by verified
	// email, then a pending invite. Anything else is refused.
	loginWithSso = async (claims: SsoClaims) => {
		const method = "loginWithSso";

		// SSO must never bootstrap an instance. registerUser grants superadmin to whoever registers
		// first; mirroring that here would hand the instance to the first provider user to arrive.
		// Local registration stays open while there is no superadmin, so this is not a lockout.
		// The superadmin's team is also the team an auto-provisioned user joins, so one lookup serves both.
		const superAdminTeamId = await this.usersRepository.findSuperAdminTeamId();
		if (!superAdminTeamId) {
			throw this.ssoFail(method, "not_initialized", "Complete the Checkmate first-run setup before signing in with single sign-on");
		}

		const linked = await this.usersRepository.findBySsoSubject(claims.issuer, claims.subject);
		if (linked) {
			return this.issueSsoSession(linked, "linked");
		}

		const existing = await this.usersRepository.findByEmailOrNull(claims.email);
		if (existing) {
			// Already bound to a different identity. This is what stops a recycled address: the
			// previous holder's account keeps its link, and rebinding takes an administrator.
			if (existing.ssoSubject && (existing.ssoIssuer !== claims.issuer || existing.ssoSubject !== claims.subject)) {
				throw this.ssoFail(method, "not_invited", "This account is linked to a different single sign-on identity");
			}

			// Claiming an account that already exists always requires a verified address, even where
			// OIDC_REQUIRE_VERIFIED_EMAIL has relaxed the global check. That setting exists for
			// providers that omit the claim, and must not also open up taking over an admin account.
			if (!claims.emailVerified) {
				throw this.ssoFail(method, "email_unverified", "The identity provider has not verified this email address");
			}

			// Remember the subject so the account survives an email change at the provider.
			// Role and team are managed in Checkmate and left alone.
			await this.usersRepository.updateById(existing.id, { ssoIssuer: claims.issuer, ssoSubject: claims.subject }, null);
			return this.issueSsoSession(existing, "matched");
		}

		const invite = await this.invitesRepository.findByEmailAndDelete(claims.email);
		if (invite) {
			return this.provisionSsoUser(claims, invite.role.length > 0 ? invite.role : ["user"], invite.teamId, "invite");
		}

		// Off by default. When on, anyone the provider accepts gets an account, so the role is capped
		// at user or admin at boot and the team is the superadmin's: teamId is immutable, and a wrong
		// one cannot be corrected through the API.
		const oidc = this.settingsService.getOidcConfig();
		if (oidc?.autoProvision) {
			return this.provisionSsoUser(claims, [oidc.defaultRole], superAdminTeamId, "auto-provision");
		}

		// One opaque reason for every "no account" case, so this is not an account oracle.
		throw this.ssoFail(method, "not_invited", "No Checkmate account matches this identity. Ask an administrator for an invite.");
	};

	private provisionSsoUser = async (claims: SsoClaims, role: UserRole[], teamId: string, via: string) => {
		const newUser = await this.usersRepository.create(
			{
				firstName: claims.firstName,
				lastName: claims.lastName,
				email: claims.email,
				role,
				teamId,
				ssoIssuer: claims.issuer,
				ssoSubject: claims.subject,
			},
			null
		);

		this.logger.info({
			message: "Provisioned a user from single sign-on",
			service: SERVICE_NAME,
			method: "loginWithSso",
			details: { userId: newUser.id, role, teamId, via },
		});

		return this.issueSessionFor(newUser);
	};

	// Always maps through toUserResponse first: findByEmailOrNull and findBySsoSubject return the
	// password hash, which must not end up inside a signed token.
	private issueSsoSession = (user: User, via: string) => {
		this.logger.info({
			message: "User signed in with single sign-on",
			service: SERVICE_NAME,
			method: "loginWithSso",
			details: { userId: user.id, via },
		});
		return this.issueSessionFor(toUserResponse(user));
	};

	private issueSessionFor = (userResponse: UserResponse) => {
		const appSettings = this.settingsService.getSettings();
		const token = this.issueToken({ ...userResponse, avatarImage: "" }, appSettings);
		return { user: userResponse, token };
	};

	private ssoFail = (method: string, code: SsoErrorCode, message: string): AppError =>
		new AppError({ message, status: 401, service: SERVICE_NAME, method, details: { code } });

	editUser = async (
		updates: Partial<User & { newPassword?: string; deleteProfileImage?: boolean }>,
		file: Express.Multer.File | null,
		currentUserId: string,
		currentUserEmail: string
	) => {
		// Change Password check
		if (updates.password && updates.newPassword) {
			updates.email = currentUserEmail;
			const user = await this.usersRepository.findByEmail(currentUserEmail);
			const match = await bcrypt.compare(updates.password, this.requirePasswordHash(user, "editUser", 403));
			// If not a match, throw a 403
			// 403 instead of 401 to avoid triggering axios interceptor
			if (!match) {
				throw new AppError({ message: "Incorrect current password", service: SERVICE_NAME, status: 403 });
			}
			// If a match, update the password
			updates.password = this.hashPassword(updates.newPassword);
			delete updates.newPassword;
		}

		return await this.usersRepository.updateById(currentUserId, updates, file);
	};

	checkSuperadminExists = async () => {
		return await this.usersRepository.findSuperAdmin();
	};

	requestRecovery = async (email: string) => {
		this.assertLocalLoginEnabled("requestRecovery");
		const user = await this.usersRepository.findByEmail(email);
		// Reject before a token is minted: otherwise an SSO-only account could be given a password through recovery,
		// re-enabling local login for it even when local login is disabled.
		this.requirePasswordHash(user, "requestRecovery", 400);

		// Delete existing tokens
		await this.recoveryTokensRepository.deleteManyByEmail(email);
		const recoveryToken = await this.recoveryTokensRepository.create(email);
		const name = user.firstName;
		const settings = this.settingsService.getSettings();
		const url = `${settings.clientHost}/set-new-password/${recoveryToken.token}`;

		const html = await this.emailService.buildEmail("passwordResetTemplate", {
			name,
			email,
			url,
		});
		if (!html) {
			throw new AppError({
				message: "Failed to build password reset email HTML",
				service: SERVICE_NAME,
				method: "requestRecovery",
				status: 500,
			});
		}
		const msgId = await this.emailService.sendEmail(email, "Checkmate Password Reset", html);
		return msgId;
	};

	validateRecovery = async (recoveryToken: string) => {
		this.assertLocalLoginEnabled("validateRecovery");
		// Throws if token not found, validating
		await this.recoveryTokensRepository.findByToken(recoveryToken);
	};

	resetPassword = async (password: string, recoveryToken: string) => {
		this.assertLocalLoginEnabled("resetPassword");
		const existingToken = await this.recoveryTokensRepository.findByToken(recoveryToken);
		const existingUser = await this.usersRepository.findByEmail(existingToken.email);

		const match = await bcrypt.compare(password, this.requirePasswordHash(existingUser, "resetPassword", 400));
		if (match === true) {
			throw new AppError({ message: "New password cannot be same as old password", service: SERVICE_NAME, status: 400 });
		}

		const hashedPassword = this.hashPassword(password);
		await this.usersRepository.updateById(existingUser.id, { password: hashedPassword }, null);
		await this.recoveryTokensRepository.deleteManyByEmail(existingUser.email);

		const userResponse = toUserResponse(existingUser);
		const token = this.issueToken(userResponse, await this.settingsService.getSettings());

		return { user: userResponse, token };
	};

	deleteUser = async ({ userId, teamId, roles }: { userId: string; teamId: string; roles: UserRole[] }) => {
		if (roles.includes("demo")) {
			throw new AppError({ message: "Demo user cannot be deleted", service: SERVICE_NAME, method: "deleteUser", status: 400 });
		}

		if (roles.includes("superadmin")) {
			const monitors = await this.monitorsRepository.findByTeamId(teamId, {}, { includeRecentChecks: false });
			if (monitors) {
				await Promise.all(monitors.map((monitor) => this.scheduler.deleteJob(monitor)));
			}
		}
		// 6. Delete the user by id
		await this.usersRepository.deleteById(userId);
	};

	deleteUserById = async ({
		actorId,
		actorRoles,
		actorTeamId,
		targetUserId,
	}: {
		actorId: string;
		actorTeamId: string;
		actorRoles: UserRole[];
		targetUserId: string;
	}) => {
		if (actorId === targetUserId) {
			throw new AppError({ message: "Cannot delete your own account from here", service: SERVICE_NAME, method: "deleteUserById", status: 400 });
		}

		const targetUser = await this.usersRepository.findById(targetUserId);

		if (targetUser.teamId !== actorTeamId) {
			throw new AppError({ message: "User is not on your team", service: SERVICE_NAME, method: "deleteUserById", status: 403 });
		}

		if (targetUser.role.includes("demo")) {
			throw new AppError({ message: "Demo user cannot be deleted", service: SERVICE_NAME, method: "deleteUserById", status: 400 });
		}

		const targetRoles = targetUser.role;

		// Check actor can manage all of target's roles
		for (const targetRole of targetRoles) {
			const canManage = actorRoles.some((actorRole) => canManageRole(actorRole, targetRole));
			if (!canManage) {
				throw new AppError({
					message: "You do not have permission to remove this user",
					service: SERVICE_NAME,
					method: "deleteUserById",
					status: 403,
				});
			}
		}

		await this.usersRepository.deleteById(targetUserId);

		this.logger.info({
			message: `User ${targetUserId} deleted by ${actorId}`,
			service: SERVICE_NAME,
			method: "deleteUserById",
		});
	};

	getAllUsers = async () => {
		return await this.usersRepository.findAll();
	};

	getUserById = async (roles: UserRole[], userId: string) => {
		if (!roles.includes("superadmin") && !roles.includes("admin")) {
			throw new AppError({ message: "Insufficient permissions", service: SERVICE_NAME, status: 403 });
		}
		return await this.usersRepository.findById(userId);
	};

	editUserById = async (userId: string, patch: Partial<User>) => {
		await this.usersRepository.updateById(userId, patch, null);
	};

	setPasswordByUserId = async (userId: string, password: string) => {
		// Writing a password is a password entry point too: without this a superadmin could give an
		// SSO-only account a hash that outlives the next flip of the flag.
		this.assertLocalLoginEnabled("setPasswordByUserId");
		const hashedPassword = this.hashPassword(password);
		const updatedUser = await this.usersRepository.updateById(userId, { password: hashedPassword }, null);
		return updatedUser;
	};
}
