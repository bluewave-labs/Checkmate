import {
	IInvitesRepository,
	IMonitorsRepository,
	IRecoveryTokensRepository,
	IUsersRepository,
	ISettingsRepository,
	ITeamsRepository,
} from "@/repositories/index.js";
import type { User } from "@/types/index.js";
import { canManageRole, type UserRole } from "@/types/user.js";
import bcrypt from "bcryptjs";
import { AppError } from "@/utils/AppError.js";
import { ISuperSimpleQueue } from "@/service/infrastructure/SuperSimpleQueue/SuperSimpleQueue.js";
import { IEmailService } from "@/service/infrastructure/emailService.js";
import { EnvConfig, ISettingsService } from "@/service/system/settingsService.js";
import { ILogger } from "@/utils/logger.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
type CryptoType = typeof crypto;
type JwtType = typeof jwt;
const SERVICE_NAME = "userService";

export interface IUserService {
	issueToken(payload: Partial<User>, appSettings: EnvConfig): string;
	registerUser(user: Partial<User>, inviteToken: string, file: Express.Multer.File | null): Promise<{ user: User; token: string }>;
	createUser(userData: Partial<User>, teamId: string, actorRoles: UserRole[], file: Express.Multer.File | null): Promise<User>;
	loginUser(email: string, password: string): Promise<{ user: User; token: string }>;
	editUser(
		updates: Partial<User & { newPassword?: string }>,
		file: Express.Multer.File | null,
		currentUserId: string,
		currentUserEmail: string
	): Promise<User>;
	checkSuperadminExists(): Promise<boolean>;
	requestRecovery(email: string): Promise<string | false | undefined>;
	validateRecovery(recoveryToken: string): Promise<void>;
	resetPassword(password: string, recoveryToken: string): Promise<{ user: User; token: string }>;
	deleteUser(params: { userId: string; teamId: string; roles: UserRole[] }): Promise<void>;
	deleteUserById(params: { actorId: string; actorTeamId: string; actorRoles: UserRole[]; targetUserId: string }): Promise<void>;
	getAllUsers(): Promise<User[]>;
	getUserById(roles: UserRole[], userId: string): Promise<User>;
	editUserById(userId: string, patch: Partial<User>): Promise<void>;
	setPasswordByUserId(userId: string, password: string): Promise<User>;
}

export class UserService implements IUserService {
	static SERVICE_NAME = SERVICE_NAME;

	private hashPassword = (password: string): string => {
		const salt = bcrypt.genSaltSync(10);
		return bcrypt.hashSync(password, salt);
	};

	private emailService: IEmailService;
	private settingsService: ISettingsService;
	private logger: ILogger;
	private jwt: JwtType;
	private jobQueue: ISuperSimpleQueue;
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
		jobQueue,
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
		jobQueue: ISuperSimpleQueue;
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
		this.jobQueue = jobQueue;
		this.crypto = crypto;
		this.monitorsRepository = monitorsRepository;
		this.usersRepository = usersRepository;
		this.invitesRepository = invitesRepository;
		this.recoveryTokensRepository = recoveryTokensRepository;
		this.settingsRepository = settingsRepository;
		this.teamsRepository = teamsRepository;
	}

	get serviceName() {
		return UserService.SERVICE_NAME;
	}

	issueToken = (payload: Partial<User>, appSettings: EnvConfig) => {
		return this.jwt.sign(payload, appSettings.jwtSecret, { expiresIn: appSettings.jwtTTL });
	};

	registerUser = async (user: Partial<User>, inviteToken: string, file: Express.Multer.File | null) => {
		// Create a new user
		// If superAdmin exists, a token should be attached to all further register requests
		const superAdminExists = await this.usersRepository.findSuperAdmin();
		if (superAdminExists) {
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

		delete newUser.profileImage;
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

		newUser.profileImage = undefined;
		newUser.avatarImage = undefined;
		newUser.password = "";

		return newUser;
	};

	loginUser = async (email: string, password: string) => {
		// Check if user exists
		const user = await this.usersRepository.findByEmail(email);
		// Compare password
		const match = await bcrypt.compare(password, user.password);

		if (match !== true) {
			throw new AppError({ message: "Incorrect password", service: SERVICE_NAME, status: 401 });
		}

		// Remove password from user object.  Should this be abstracted to DB layer?
		const userWithoutPassword = { ...user };
		userWithoutPassword.password = "";
		userWithoutPassword.avatarImage = "";

		// Happy path, return token
		const appSettings = await this.settingsService.getSettings();
		const token = this.issueToken(userWithoutPassword, appSettings);
		// reset avatar image
		userWithoutPassword.avatarImage = user.avatarImage;
		return { user: userWithoutPassword, token };
	};

	editUser = async (
		updates: Partial<User & { newPassword?: string }>,
		file: Express.Multer.File | null,
		currentUserId: string,
		currentUserEmail: string
	) => {
		// Change Password check
		if (updates.password && updates.newPassword) {
			updates.email = currentUserEmail;
			const user = await this.usersRepository.findByEmail(currentUserEmail);
			const match = await bcrypt.compare(updates.password, user.password);
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
		const user = await this.usersRepository.findByEmail(email);

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
		// Throws if token not found, validating
		await this.recoveryTokensRepository.findByToken(recoveryToken);
	};

	resetPassword = async (password: string, recoveryToken: string) => {
		const existingToken = await this.recoveryTokensRepository.findByToken(recoveryToken);
		const existingUser = await this.usersRepository.findByEmail(existingToken.email);

		const match = await bcrypt.compare(password, existingUser.password);
		if (match === true) {
			throw new AppError({ message: "New password cannot be same as old password", service: SERVICE_NAME, status: 400 });
		}

		const hashedPassword = this.hashPassword(password);
		await this.usersRepository.updateById(existingUser.id, { password: hashedPassword }, null);
		await this.recoveryTokensRepository.deleteManyByEmail(existingUser.email);

		existingUser.password = "";
		existingUser.profileImage = undefined;

		const token = this.issueToken(existingUser, await this.settingsService.getSettings());

		return { user: existingUser, token };
	};

	deleteUser = async ({ userId, teamId, roles }: { userId: string; teamId: string; roles: UserRole[] }) => {
		if (roles.includes("demo")) {
			throw new AppError({ message: "Demo user cannot be deleted", service: SERVICE_NAME, method: "deleteUser", status: 400 });
		}

		if (roles.includes("superadmin")) {
			const monitors = await this.monitorsRepository.findByTeamId(teamId, {});
			if (monitors) {
				await Promise.all(monitors.map((monitor) => this.jobQueue.deleteJob(monitor)));
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
		const hashedPassword = this.hashPassword(password);
		const updatedUser = await this.usersRepository.updateById(userId, { password: hashedPassword }, null);
		return updatedUser;
	};
}
