const SERVICE_NAME = "userService";

class UserService {
	static SERVICE_NAME = SERVICE_NAME;
	constructor({ db, emailService, settingsService, logger, stringService, jwt, errorService }) {
		this.db = db;
		this.emailService = emailService;
		this.settingsService = settingsService;
		this.logger = logger;
		this.stringService = stringService;
		this.jwt = jwt;
		this.errorService = errorService;
	}

	issueToken = (payload, appSettings) => {
		const tokenTTL = appSettings?.jwtTTL ?? "2h";
		const tokenSecret = appSettings?.jwtSecret;
		const payloadData = payload;
		return this.jwt.sign(payloadData, tokenSecret, { expiresIn: tokenTTL });
	};

	registerUser = async (user, file) => {
		// Create a new user
		// If superAdmin exists, a token should be attached to all further register requests
		const superAdminExists = await this.db.checkSuperadmin();
		if (superAdminExists) {
			const invitedUser = await this.db.getInviteTokenAndDelete(user.inviteToken);
			user.role = invitedUser.role;
			user.teamId = invitedUser.teamId;
		} else {
			// This is the first account, create JWT secret to use if one is not supplied by env
			const jwtSecret = crypto.randomBytes(64).toString("hex");
			await this.db.updateAppSettings({ jwtSecret });
		}

		const newUser = await this.db.insertUser({ ...user }, file);

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
			this.emailService.sendEmail(newUser.email, "Welcome to Uptime Monitor", html).catch((error) => {
				this.logger.warn({
					message: error.message,
					service: SERVICE_NAME,
					method: "registerUser",
					stack: error.stack,
				});
			});
		} catch (error) {
			this.logger.warn({
				message: error.message,
				service: SERVICE_NAME,
				method: "registerUser",
				stack: error.stack,
			});
		}

		return { user: newUser, token };
	};

	loginUser = async (email, password) => {
		// Check if user exists
		const user = await this.db.getUserByEmail(email);
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

	editUser = async (updates, file, currentUser) => {
		// Change Password check
		if (updates?.password && updates?.newPassword) {
			// Get user's email
			// Add user email to body for DB operation
			updates.email = currentUser.email;
			// Get user
			const user = await this.db.getUserByEmail(currentUser.email);
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

		const updatedUser = await this.db.updateUser({ userId: currentUser?._id, user: updates, file: file });
		return updatedUser;
	};

	checkSuperadminExists = async () => {
		const superAdminExists = await this.db.checkSuperadmin();
		return superAdminExists;
	};

	requestRecovery = async (email) => {
		const user = await this.db.getUserByEmail(email);
		const recoveryToken = await this.db.requestRecoveryToken(email);
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

	validateRecovery = async (recoveryToken) => {
		await this.db.validateRecoveryToken(recoveryToken);
	};

	resetPassword = async (password, recoveryToken) => {
		const user = await this.db.resetPassword(password, recoveryToken);
		const appSettings = await this.settingsService.getSettings();
		const token = this.issueToken(user._doc, appSettings);
		return { user, token };
	};

	deleteUser = async (user) => {
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
		const result = await this.db.getMonitorsByTeamId({
			teamId: teamId,
		});

		if (roles.includes("superadmin")) {
			// 2.  Remove all jobs, delete checks and alerts
			result?.monitors.length > 0 &&
				(await Promise.all(
					result.monitors.map(async (monitor) => {
						await this.jobQueue.deleteJob(monitor);
					})
				));
		}
		// 6. Delete the user by id
		await this.db.deleteUser(userId);
	};

	getAllUsers = async () => {
		const users = await this.db.getAllUsers();
		return users;
	};

	getUserById = async (roles, userId) => {
		const user = await this.db.getUserById(roles, userId);
		return user;
	};

	editUserById = async (userId, user) => {
		await this.db.editUserById(userId, user);
	};
}
export default UserService;
