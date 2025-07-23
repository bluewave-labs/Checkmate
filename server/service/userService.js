const SERVICE_NAME = "userService";
import { createAuthError, createError } from "../utils/errorUtils.js";

class UserService {
	static SERVICE_NAME = SERVICE_NAME;
	constructor({ db, emailService, settingsService, logger, stringService, jwt }) {
		this.db = db;
		this.emailService = emailService;
		this.settingsService = settingsService;
		this.logger = logger;
		this.stringService = stringService;
		this.jwt = jwt;
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
			throw createAuthError(this.stringService.authIncorrectPassword);
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
				throw createError(this.stringService.authIncorrectPassword, 403);
			}
			// If a match, update the password
			updates.password = updates.newPassword;
		}

		const updatedUser = await this.db.updateUser({ userId: currentUser?._id, user: updates, file: file });
		return updatedUser;
	};
}

export default UserService;
