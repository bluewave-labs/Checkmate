import {
	registrationBodyValidation,
	loginValidation,
	editUserParamValidation,
	editUserBodyValidation,
	recoveryValidation,
	recoveryTokenValidation,
	newPasswordValidation,
} from "../validation/joi.js";
import jwt from "jsonwebtoken";
import { getTokenFromHeaders } from "../utils/utils.js";
import crypto from "crypto";
import { handleValidationError, handleError } from "./controllerUtils.js";
const SERVICE_NAME = "authController";

class AuthController {
	constructor({ db, settingsService, emailService, jobQueue, stringService, logger }) {
		this.db = db;
		this.settingsService = settingsService;
		this.emailService = emailService;
		this.jobQueue = jobQueue;
		this.stringService = stringService;
		this.logger = logger;
	}

	/**
	 * Creates and returns JWT token with an arbitrary payload
	 * @function
	 * @param {Object} payload
	 * @param {Object} appSettings
	 * @returns {String}
	 * @throws {Error}
	 */
	issueToken = (payload, appSettings) => {
		try {
			const tokenTTL = appSettings?.jwtTTL ?? "2h";
			const tokenSecret = appSettings?.jwtSecret;
			const payloadData = payload;

			return jwt.sign(payloadData, tokenSecret, { expiresIn: tokenTTL });
		} catch (error) {
			throw handleError(error, SERVICE_NAME, "issueToken");
		}
	};

	/**
	 * Registers a new user. If the user is the first account, a JWT secret is created. If not, an invite token is required.
	 * @async
	 * @param {Object} req - The Express request object.
	 * @property {Object} req.body - The body of the request.
	 * @property {string} req.body.inviteToken - The invite token for registration.
	 * @property {Object} req.file - The file object for the user's profile image.
	 * @param {Object} res - The Express response object.
	 * @param {function} next - The next middleware function.
	 * @returns {Object} The response object with a success status, a message indicating the creation of the user, the created user data, and a JWT token.
	 * @throws {Error} If there is an error during the process, especially if there is a validation error (422).
	 */
	registerUser = async (req, res, next) => {
		try {
			if (req.body?.email) {
				req.body.email = req.body.email?.toLowerCase();
			}
			await registrationBodyValidation.validateAsync(req.body);
		} catch (error) {
			const validationError = handleValidationError(error, SERVICE_NAME);
			next(validationError);
			return;
		}
		// Create a new user
		try {
			const user = req.body;
			// If superAdmin exists, a token should be attached to all further register requests
			const superAdminExists = await this.db.checkSuperadmin(req, res);
			if (superAdminExists) {
				const invitedUser = await this.db.getInviteTokenAndDelete(user.inviteToken);
				user.role = invitedUser.role;
				user.teamId = invitedUser.teamId;
			} else {
				// This is the first account, create JWT secret to use if one is not supplied by env
				const jwtSecret = crypto.randomBytes(64).toString("hex");
				await this.db.updateAppSettings({ jwtSecret });
			}

			const newUser = await this.db.insertUser({ ...req.body }, req.file);
			this.logger.info({
				message: this.stringService.authCreateUser,
				service: SERVICE_NAME,
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
				this.emailService
					.sendEmail(newUser.email, "Welcome to Uptime Monitor", html)
					.catch((error) => {
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

			res.success({
				msg: this.stringService.authCreateUser,
				data: { user: newUser, token: token },
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "registerController"));
		}
	};

	/**
	 * Logs in a user by validating the user's credentials and issuing a JWT token.
	 * @async
	 * @param {Object} req - The Express request object.
	 * @property {Object} req.body - The body of the request.
	 * @property {string} req.body.email - The email of the user.
	 * @property {string} req.body.password - The password of the user.
	 * @param {Object} res - The Express response object.
	 * @param {function} next - The next middleware function.
	 * @returns {Object} The response object with a success status, a message indicating the login of the user, the user data (without password and avatar image), and a JWT token.
	 * @throws {Error} If there is an error during the process, especially if there is a validation error (422) or the password is incorrect.
	 */
	loginUser = async (req, res, next) => {
		try {
			if (req.body?.email) {
				req.body.email = req.body.email?.toLowerCase();
			}
			await loginValidation.validateAsync(req.body);
		} catch (error) {
			const validationError = handleValidationError(error, SERVICE_NAME);
			next(validationError);
			return;
		}
		try {
			const { email, password } = req.body;

			// Check if user exists
			const user = await this.db.getUserByEmail(email);

			// Compare password
			const match = await user.comparePassword(password);
			if (match !== true) {
				const error = new Error(this.stringService.authIncorrectPassword);
				error.status = 401;
				next(error);
				return;
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

			return res.success({
				msg: this.stringService.authLoginUser,
				data: {
					user: userWithoutPassword,
					token: token,
				},
			});
		} catch (error) {
			error.status = 401;
			next(handleError(error, SERVICE_NAME, "loginUser"));
		}
	};

	/**
	 * Edits a user's information. If the user wants to change their password, the current password is checked before updating to the new password.
	 * @async
	 * @param {Object} req - The Express request object.
	 * @property {Object} req.params - The parameters of the request.
	 * @property {string} req.params.userId - The ID of the user to be edited.
	 * @property {Object} req.body - The body of the request.
	 * @property {string} req.body.password - The current password of the user.
	 * @property {string} req.body.newPassword - The new password of the user.
	 * @param {Object} res - The Express response object.
	 * @param {function} next - The next middleware function.
	 * @returns {Object} The response object with a success status, a message indicating the update of the user, and the updated user data.
	 * @throws {Error} If there is an error during the process, especially if there is a validation error (422), the user is unauthorized (401), or the password is incorrect (403).
	 */
	editUser = async (req, res, next) => {
		try {
			await editUserParamValidation.validateAsync(req.params);
			await editUserBodyValidation.validateAsync(req.body);
		} catch (error) {
			const validationError = handleValidationError(error, SERVICE_NAME);
			next(validationError);
			return;
		}

		// TODO is this neccessary any longer? Verify ownership middleware should handle this
		if (req.params.userId !== req.user._id.toString()) {
			const error = new Error(this.stringService.unauthorized);
			error.status = 401;
			error.service = SERVICE_NAME;
			next(error);
			return;
		}

		try {
			// Change Password check
			if (req.body.password && req.body.newPassword) {
				// Get token from headers
				const token = getTokenFromHeaders(req.headers);
				// Get email from token
				const { jwtSecret } = this.settingsService.getSettings();
				const { email } = jwt.verify(token, jwtSecret);
				// Add user email to body for DB operation
				req.body.email = email;
				// Get user
				const user = await this.db.getUserByEmail(email);
				// Compare passwords
				const match = await user.comparePassword(req.body.password);
				// If not a match, throw a 403
				// 403 instead of 401 to avoid triggering axios interceptor
				if (!match) {
					const error = new Error(this.stringService.authIncorrectPassword);
					error.status = 403;
					next(error);
					return;
				}
				// If a match, update the password
				req.body.password = req.body.newPassword;
			}

			const updatedUser = await this.db.updateUser(req, res);
			res.success({
				msg: this.stringService.authUpdateUser,
				data: updatedUser,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "userEditController"));
		}
	};

	/**
	 * Checks if a superadmin account exists in the database.
	 * @async
	 * @param {Object} req - The Express request object.
	 * @param {Object} res - The Express response object.
	 * @param {function} next - The next middleware function.
	 * @returns {Object} The response object with a success status, a message indicating the existence of a superadmin, and a boolean indicating the existence of a superadmin.
	 * @throws {Error} If there is an error during the process.
	 */
	checkSuperadminExists = async (req, res, next) => {
		try {
			const superAdminExists = await this.db.checkSuperadmin(req, res);

			return res.success({
				msg: this.stringService.authAdminExists,
				data: superAdminExists,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "checkSuperadminController"));
		}
	};
	/**
	 * Requests a recovery token for a user. The user's email is validated and a recovery token is created and sent via email.
	 * @async
	 * @param {Object} req - The Express request object.
	 * @property {Object} req.body - The body of the request.
	 * @property {string} req.body.email - The email of the user requesting recovery.
	 * @param {Object} res - The Express response object.
	 * @param {function} next - The next middleware function.
	 * @returns {Object} The response object with a success status, a message indicating the creation of the recovery token, and the message ID of the sent email.
	 * @throws {Error} If there is an error during the process, especially if there is a validation error (422).
	 */
	requestRecovery = async (req, res, next) => {
		try {
			await recoveryValidation.validateAsync(req.body);
		} catch (error) {
			const validationError = handleValidationError(error, SERVICE_NAME);
			next(validationError);
			return;
		}

		try {
			const { email } = req.body;
			const user = await this.db.getUserByEmail(email);
			const recoveryToken = await this.db.requestRecoveryToken(req, res);
			const name = user.firstName;
			const { clientHost } = this.settingsService.getSettings();
			const url = `${clientHost}/set-new-password/${recoveryToken.token}`;

			const html = await this.emailService.buildEmail("passwordResetTemplate", {
				name,
				email,
				url,
			});
			const msgId = await this.emailService.sendEmail(
				email,
				"Checkmate Password Reset",
				html
			);

			return res.success({
				msg: this.stringService.authCreateRecoveryToken,
				data: msgId,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "recoveryRequestController"));
		}
	};
	/**
	 * Validates a recovery token. The recovery token is validated and if valid, a success message is returned.
	 * @async
	 * @param {Object} req - The Express request object.
	 * @property {Object} req.body - The body of the request.
	 * @property {string} req.body.token - The recovery token to be validated.
	 * @param {Object} res - The Express response object.
	 * @param {function} next - The next middleware function.
	 * @returns {Object} The response object with a success status and a message indicating the validation of the recovery token.
	 * @throws {Error} If there is an error during the process, especially if there is a validation error (422).
	 */
	validateRecovery = async (req, res, next) => {
		try {
			await recoveryTokenValidation.validateAsync(req.body);
		} catch (error) {
			const validationError = handleValidationError(error, SERVICE_NAME);
			next(validationError);
			return;
		}

		try {
			await this.db.validateRecoveryToken(req, res);

			return res.success({
				msg: this.stringService.authVerifyRecoveryToken,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "validateRecoveryTokenController"));
		}
	};

	/**
	 * Resets a user's password. The new password is validated and if valid, the user's password is updated in the database and a new JWT token is issued.
	 * @async
	 * @param {Object} req - The Express request object.
	 * @property {Object} req.body - The body of the request.
	 * @property {string} req.body.token - The recovery token.
	 * @property {string} req.body.password - The new password of the user.
	 * @param {Object} res - The Express response object.
	 * @param {function} next - The next middleware function.
	 * @returns {Object} The response object with a success status, a message indicating the reset of the password, the updated user data (without password and avatar image), and a new JWT token.
	 * @throws {Error} If there is an error during the process, especially if there is a validation error (422).
	 */
	resetPassword = async (req, res, next) => {
		try {
			await newPasswordValidation.validateAsync(req.body);
		} catch (error) {
			const validationError = handleValidationError(error, SERVICE_NAME);
			next(validationError);
			return;
		}
		try {
			const user = await this.db.resetPassword(req, res);
			const appSettings = await this.settingsService.getSettings();
			const token = this.issueToken(user._doc, appSettings);

			return res.success({
				msg: this.stringService.authResetPassword,
				data: { user, token },
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "resetPasswordController"));
		}
	};

	/**
	 * Deletes a user and all associated monitors, checks, and alerts.
	 *
	 * @param {Object} req - The request object.
	 * @param {Object} res - The response object.
	 * @param {Function} next - The next middleware function.
	 * @returns {Object} The response object with success status and message.
	 * @throws {Error} If user validation fails or user is not found in the database.
	 */
	deleteUser = async (req, res, next) => {
		try {
			const token = getTokenFromHeaders(req.headers);
			const decodedToken = jwt.decode(token);
			const { email } = decodedToken;

			// Check if the user exists
			const user = await this.db.getUserByEmail(email);
			// 1. Find all the monitors associated with the team ID if superadmin

			const result = await this.db.getMonitorsByTeamId({
				query: {},
				params: { teamId: user.teamId.toString() },
			});

			if (user.role.includes("superadmin")) {
				//2.  Remove all jobs, delete checks and alerts
				result?.monitors.length > 0 &&
					(await Promise.all(
						result.monitors.map(async (monitor) => {
							await this.jobQueue.deleteJob(monitor);
						})
					));

				// 3. Delete team
				await this.db.deleteTeam(user.teamId);
				// 4. Delete all other team members
				await this.db.deleteAllOtherUsers();
				// 5. Delete each monitor
				await this.db.deleteMonitorsByUserId(user._id);
			}
			// 6. Delete the user by id
			await this.db.deleteUser(user._id);

			return res.success({
				msg: this.stringService.authDeleteUser,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "deleteUserController"));
		}
	};

	getAllUsers = async (req, res, next) => {
		try {
			const allUsers = await this.db.getAllUsers(req, res);

			return res.success({
				msg: this.stringService.authGetAllUsers,
				data: allUsers,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getAllUsersController"));
		}
	};
}

export default AuthController;
