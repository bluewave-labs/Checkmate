import { IMonitorsRepository } from "@/repositories/index.js";

const SERVICE_NAME = "userService";

class UserService {
	static SERVICE_NAME = SERVICE_NAME;

	private db: any;
	private emailService: any;
	private settingsService: any;
	private logger: any;
	private stringService: any;
	private jwt: any;
	private errorService: any;
	private jobQueue: any;
	private crypto: any;
	private monitorsRepository: IMonitorsRepository;

	constructor({
		crypto,
		db,
		emailService,
		settingsService,
		logger,
		stringService,
		jwt,
		errorService,
		jobQueue,
		monitorsRepository,
	}: {
		crypto: any;
		db: any;
		emailService: any;
		settingsService: any;
		logger: any;
		stringService: any;
		jwt: any;
		errorService: any;
		jobQueue: any;
		monitorsRepository: IMonitorsRepository;
	}) {
		this.db = db;
		this.emailService = emailService;
		this.settingsService = settingsService;
		this.logger = logger;
		this.stringService = stringService;
		this.jwt = jwt;
		this.errorService = errorService;
		this.jobQueue = jobQueue;
		this.crypto = crypto;
		this.monitorsRepository = monitorsRepository;
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

	registerUser = async (user: any, file: any) => {
		// Create a new user
		// If superAdmin exists, a token should be attached to all further register requests
		const superAdminExists = await this.db.userModule.checkSuperadmin();
		if (superAdminExists) {
			const invitedUser = await this.db.inviteModule.getInviteTokenAndDelete(user.inviteToken);
			user.role = invitedUser.role;
			user.teamId = invitedUser.teamId;
		} else {
			// This is the first account, create JWT secret to use if one is not supplied by env
			const jwtSecret = this.crypto.randomBytes(64).toString("hex");
			await this.db.settingsModule.updateAppSettings({ jwtSecret });
		}

		const newUser = await this.db.userModule.insertUser({ ...user }, file);

		this.logger.debug({
			message: "New user created",
			service: SERVICE_NAME,
			method: "registerUser",
			details: newUser._id,
		});

		const userForToken = { ...newUser._doc };
		delete userForToken.profileImage;
		delete userForToken.avatarImage;

		const appSettings = await this.settingsService.getSettings();

		const token = this.issueToken(userForToken, appSettings);

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
		const user = await this.db.userModule.getUserByEmail(email);
		// Compare password
		const match = await user.comparePassword(password);
		if (match !== true) {
			throw this.errorService.createAuthenticationError(this.stringService.authIncorrectPassword);
		}

		// Remove password from user object.  Should this be abstracted to DB layer?
		const userWithoutPassword = { ...user._doc };
		delete userWithoutPassword.password;
		delete userWithoutPassword.avatarImage;

		// Happy path, return token
		const appSettings = await this.settingsService.getSettings();
		const token = this.issueToken(userWithoutPassword, appSettings);
		// reset avatar image
		userWithoutPassword.avatarImage = user.avatarImage;
		return { user: userWithoutPassword, token };
	};

	editUser = async (updates: any, file: any, currentUser: any) => {
		// Change Password check
		if (updates?.password && updates?.newPassword) {
			// Get user's email
			// Add user email to body for DB operation
			updates.email = currentUser.email;
			// Get user
			const user = await this.db.userModule.getUserByEmail(currentUser.email);
			// Compare passwords
			const match = await user.comparePassword(updates?.password);
			// If not a match, throw a 403
			// 403 instead of 401 to avoid triggering axios interceptor
			if (!match) {
				throw this.errorService.createAuthorizationError(this.stringService.authIncorrectPassword);
			}
			// If a match, update the password
			updates.password = updates.newPassword;
		}

		const updatedUser = await this.db.userModule.updateUser({ userId: currentUser?._id, user: updates, file: file });
		return updatedUser;
	};

	checkSuperadminExists = async () => {
		const superAdminExists = await this.db.userModule.checkSuperadmin();
		return superAdminExists;
	};

	requestRecovery = async (email: string) => {
		const user = await this.db.userModule.getUserByEmail(email);
		const recoveryToken = await this.db.recoveryModule.requestRecoveryToken(email);
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
		await this.db.recoveryModule.validateRecoveryToken(recoveryToken);
	};

	resetPassword = async (password: string, recoveryToken: string) => {
		const user = await this.db.recoveryModule.resetPassword(password, recoveryToken);
		const appSettings = await this.settingsService.getSettings();
		const token = this.issueToken(user._doc, appSettings);
		return { user, token };
	};

	deleteUser = async (user: any) => {
		const email = user?.email;
		if (!email) {
			throw this.errorService.createBadRequestError("No email in request");
		}

		const teamId = user?.teamId;
		const userId = user?._id;

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
		await this.db.userModule.deleteUser(userId);
	};

	getAllUsers = async () => {
		const users = await this.db.userModule.getAllUsers();
		return users;
	};

	getUserById = async (roles: any, userId: any) => {
		const user = await this.db.userModule.getUserById(roles, userId);
		return user;
	};

	editUserById = async (userId: any, user: any) => {
		await this.db.userModule.editUserById(userId, user);
	};
	setPasswordByUserId = async (userId: any, password: string) => {
		const updatedUser = await this.db.userModule.updateUser({ userId: userId, user: { password: password }, file: null });
		return updatedUser;
	};
}
export default UserService;
