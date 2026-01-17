import { IInvitesRepository, IMonitorsRepository, IRecoveryTokensRepository, IUsersRepository, ISettingsRepository } from "@/repositories/index.js";
import Team from "@/db/models/Team.js";
import type { User } from "@/types/index.js";
import bcrypt from "bcryptjs";
import { AppError } from "@/utils/AppError.js";

const SERVICE_NAME = "userService";

class UserService {
	static SERVICE_NAME = SERVICE_NAME;

	private emailService: any;
	private settingsService: any;
	private logger: any;
	private stringService: any;
	private jwt: any;
	private errorService: any;
	private jobQueue: any;
	private crypto: any;
	private monitorsRepository: IMonitorsRepository;
	private usersRepository: IUsersRepository;
	private invitesRepository: IInvitesRepository;
	private recoveryTokensRepository: IRecoveryTokensRepository;
	private settingsRepository: ISettingsRepository;

	constructor({
		crypto,
		emailService,
		settingsService,
		logger,
		stringService,
		jwt,
		errorService,
		jobQueue,
		monitorsRepository,
		usersRepository,
		invitesRepository,
		recoveryTokensRepository,
		settingsRepository,
	}: {
		crypto: any;
		emailService: any;
		settingsService: any;
		logger: any;
		stringService: any;
		jwt: any;
		errorService: any;
		jobQueue: any;
		monitorsRepository: IMonitorsRepository;
		usersRepository: IUsersRepository;
		invitesRepository: IInvitesRepository;
		recoveryTokensRepository: IRecoveryTokensRepository;
		settingsRepository: ISettingsRepository;
	}) {
		this.emailService = emailService;
		this.settingsService = settingsService;
		this.logger = logger;
		this.stringService = stringService;
		this.jwt = jwt;
		this.errorService = errorService;
		this.jobQueue = jobQueue;
		this.crypto = crypto;
		this.monitorsRepository = monitorsRepository;
		this.usersRepository = usersRepository;
		this.invitesRepository = invitesRepository;
		this.recoveryTokensRepository = recoveryTokensRepository;
		this.settingsRepository = settingsRepository;
	}

	get serviceName() {
		return UserService.SERVICE_NAME;
	}

	issueToken = (payload: any, appSettings: any) => {
		const tokenTTL = appSettings?.jwtTTL ?? "2h";
		const tokenSecret = appSettings?.jwtSecret;
		const payloadData = payload;
		return this.jwt.sign(payloadData, tokenSecret, { expiresIn: tokenTTL });
	};

	registerUser = async (user: Partial<User>, inviteToken: string, file: any) => {
		// Create a new user
		// If superAdmin exists, a token should be attached to all further register requests
		const superAdminExists = await this.usersRepository.findSuperAdmin();
		if (superAdminExists) {
			const invite = await this.invitesRepository.findByTokenAndDelete(inviteToken);
			user.role = invite.role;
			user.teamId = invite.teamId;
		} else {
			// This is the first account, create JWT secret to use if one is not supplied by env
			const jwtSecret = this.crypto.randomBytes(64).toString("hex");
			await this.settingsRepository.update({ jwtSecret });
			// Create a new team
			const team = new Team({
				email: user.email,
			});
			user.teamId = team._id;
		}

		const newUser = await this.usersRepository.create({ ...user }, file);

		this.logger.debug({
			message: "New user created",
			service: SERVICE_NAME,
			method: "registerUser",
			details: newUser.id,
		});

		delete newUser.profileImage;
		delete newUser.avatarImage;

		const appSettings = await this.settingsService.getSettings();

		const token = this.issueToken(newUser, appSettings);

		try {
			const html = await this.emailService.buildEmail("welcomeEmailTemplate", {
				name: newUser.firstName,
			});
			this.emailService.sendEmail(newUser.email, "Welcome to Uptime Monitor", html).catch((error: any) => {
				this.logger.warn({
					message: error.message,
					service: SERVICE_NAME,
					method: "registerUser",
					stack: error.stack,
				});
			});
		} catch (error: any) {
			this.logger.warn({
				message: error.message,
				service: SERVICE_NAME,
				method: "registerUser",
				stack: error.stack,
			});
		}

		return { user: newUser, token };
	};

	loginUser = async (email: string, password: string) => {
		// Check if user exists
		const user = await this.usersRepository.findByEmail(email);
		// Compare password
		const match = await bcrypt.compare(password, user.password);

		if (match !== true) {
			throw this.errorService.createAuthenticationError(this.stringService.authIncorrectPassword);
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

	editUser = async (updates: Partial<User & { newPassword?: string }>, file: any, currentUser: any) => {
		// Change Password check
		if (updates?.password && updates?.newPassword) {
			// Get user's email
			// Add user email to body for DB operation
			updates.email = currentUser.email;
			// Get user
			const user = await this.usersRepository.findByEmail(currentUser.email);
			// Compare passwords
			const match = await bcrypt.compare(updates?.password, user.password);
			// If not a match, throw a 403
			// 403 instead of 401 to avoid triggering axios interceptor
			if (!match) {
				throw this.errorService.createAuthorizationError(this.stringService.authIncorrectPassword);
			}
			// If a match, update the password
			updates.password = updates.newPassword;
		}

		return await this.usersRepository.updateById(currentUser.id, updates, file);
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
		const { clientHost } = this.settingsService.getSettings();
		const url = `${clientHost}/set-new-password/${recoveryToken.token}`;

		const html = await this.emailService.buildEmail("passwordResetTemplate", {
			name,
			email,
			url,
		});
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

		existingUser.password = password;
		await this.usersRepository.updateById(existingUser.id, existingUser, null);
		await this.recoveryTokensRepository.deleteManyByEmail(existingUser.email);

		existingUser.password = "";
		existingUser.profileImage = undefined;

		const token = this.issueToken(existingUser, await this.settingsService.getSettings());

		return { user: existingUser, token };
	};

	deleteUser = async (user: User) => {
		const email = user?.email;
		if (!email) {
			throw this.errorService.createBadRequestError("No email in request");
		}

		const teamId = user?.teamId;
		const userId = user?.id;

		if (!teamId) {
			throw this.errorService.createBadRequestError("No team ID in request");
		}

		if (!userId) {
			throw this.errorService.createBadRequestError("No user ID in request");
		}

		const roles = user?.role;
		if (roles.includes("demo")) {
			throw this.errorService.createBadRequestError("Demo user cannot be deleted");
		}

		// 1. Find all the monitors associated with the team ID if superadmin
		const res = await this.monitorsRepository.findByTeamId(teamId, {});

		if (roles.includes("superadmin")) {
			// 2.  Remove all jobs, delete checks and alerts
			res &&
				res?.length > 0 &&
				(await Promise.all(
					res.map(async (monitor) => {
						await this.jobQueue.deleteJob(monitor);
					})
				));
		}
		// 6. Delete the user by id
		await this.usersRepository.deleteById(userId);
	};

	getAllUsers = async () => {
		return await this.usersRepository.findAll();
	};

	getUserById = async (roles: any, userId: any) => {
		if (!roles.includes("superadmin")) {
			throw new AppError({ message: "User is not a superadmin", service: SERVICE_NAME, status: 403 });
		}
		const user = await this.usersRepository.findById(userId);

		return user;
	};

	editUserById = async (userId: any, patch: Partial<User>) => {
		await this.usersRepository.updateById(userId, patch, null);
	};

	setPasswordByUserId = async (userId: any, password: string) => {
		const updatedUser = await this.usersRepository.updateById(userId, { password }, null);
		return updatedUser;
	};
}
export default UserService;
