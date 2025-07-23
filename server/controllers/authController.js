import {
	registrationBodyValidation,
	loginValidation,
	editUserBodyValidation,
	recoveryValidation,
	recoveryTokenValidation,
	newPasswordValidation,
	getUserByIdParamValidation,
	editUserByIdParamValidation,
	editUserByIdBodyValidation,
	editSuperadminUserByIdBodyValidation,
} from "../validation/joi.js";
import jwt from "jsonwebtoken";
import { getTokenFromHeaders } from "../utils/utils.js";
import { asyncHandler, createError } from "../utils/errorUtils.js";

const SERVICE_NAME = "authController";

class AuthController {
	constructor({ db, settingsService, emailService, jobQueue, stringService, logger, userService }) {
		this.db = db;
		this.settingsService = settingsService;
		this.emailService = emailService;
		this.jobQueue = jobQueue;
		this.stringService = stringService;
		this.logger = logger;
		this.userService = userService;
	}

	registerUser = asyncHandler(
		async (req, res, next) => {
			if (req.body?.email) {
				req.body.email = req.body.email?.toLowerCase();
			}
			await registrationBodyValidation.validateAsync(req.body);
			const { user, token } = await this.userService.registerUser(req.body, req.file);
			res.success({
				msg: this.stringService.authCreateUser,
				data: { user, token },
			});
		},
		SERVICE_NAME,
		"registerUser"
	);

	loginUser = asyncHandler(
		async (req, res, next) => {
			if (req.body?.email) {
				req.body.email = req.body.email?.toLowerCase();
			}
			await loginValidation.validateAsync(req.body);
			const { user, token } = await this.userService.loginUser(req.body.email, req.body.password);

			return res.success({
				msg: this.stringService.authLoginUser,
				data: {
					user,
					token,
				},
			});
		},
		SERVICE_NAME,
		"loginUser"
	);

	editUser = asyncHandler(
		async (req, res, next) => {
			await editUserBodyValidation.validateAsync(req.body);

			const updatedUser = await this.userService.editUser(req.body, req.file, req.user);

			res.success({
				msg: this.stringService.authUpdateUser,
				data: updatedUser,
			});
		},
		SERVICE_NAME,
		"editUser"
	);

	/**
	 * Checks if a superadmin account exists in the database.
	 * @async
	 * @param {Object} req - The Express request object.
	 * @param {Object} res - The Express response object.
	 * @param {function} next - The next middleware function.
	 * @returns {Object} The response object with a success status, a message indicating the existence of a superadmin, and a boolean indicating the existence of a superadmin.
	 * @throws {Error} If there is an error during the process.
	 */
	checkSuperadminExists = asyncHandler(
		async (req, res, next) => {
			const superAdminExists = await this.db.checkSuperadmin(req, res);
			return res.success({
				msg: this.stringService.authAdminExists,
				data: superAdminExists,
			});
		},
		SERVICE_NAME,
		"checkSuperadminExists"
	);
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
	requestRecovery = asyncHandler(
		async (req, res, next) => {
			await recoveryValidation.validateAsync(req.body);
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
			const msgId = await this.emailService.sendEmail(email, "Checkmate Password Reset", html);

			return res.success({
				msg: this.stringService.authCreateRecoveryToken,
				data: msgId,
			});
		},
		SERVICE_NAME,
		"requestRecovery"
	);
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
	validateRecovery = asyncHandler(
		async (req, res, next) => {
			await recoveryTokenValidation.validateAsync(req.body);
			await this.db.validateRecoveryToken(req, res);
			return res.success({
				msg: this.stringService.authVerifyRecoveryToken,
			});
		},
		SERVICE_NAME,
		"validateRecovery"
	);

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
	resetPassword = asyncHandler(
		async (req, res, next) => {
			await newPasswordValidation.validateAsync(req.body);
			const user = await this.db.resetPassword(req, res);
			const appSettings = await this.settingsService.getSettings();
			const token = this.issueToken(user._doc, appSettings);
			return res.success({
				msg: this.stringService.authResetPassword,
				data: { user, token },
			});
		},
		SERVICE_NAME,
		"resetPassword"
	);

	/**
	 * Deletes a user and all associated monitors, checks, and alerts.
	 *
	 * @param {Object} req - The request object.
	 * @param {Object} res - The response object.
	 * @param {Function} next - The next middleware function.
	 * @returns {Object} The response object with success status and message.
	 * @throws {Error} If user validation fails or user is not found in the database.
	 */
	deleteUser = asyncHandler(
		async (req, res, next) => {
			const email = req?.user?.email;
			if (!email) {
				throw new Error("No email in request");
			}

			const teamId = req?.user?.teamId;
			const userId = req?.user?._id;

			if (!teamId) {
				throw new Error("No team ID in request");
			}

			if (!userId) {
				throw new Error("No user ID in request");
			}

			const roles = req.user.role;
			if (roles.includes("demo")) {
				throw new Error("Demo user cannot be deleted");
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

			return res.success({
				msg: this.stringService.authDeleteUser,
			});
		},
		SERVICE_NAME,
		"deleteUser"
	);

	getAllUsers = asyncHandler(
		async (req, res, next) => {
			const allUsers = await this.db.getAllUsers(req, res);
			return res.success({
				msg: this.stringService.authGetAllUsers,
				data: allUsers,
			});
		},
		SERVICE_NAME,
		"getAllUsers"
	);

	getUserById = asyncHandler(
		async (req, res, next) => {
			await getUserByIdParamValidation.validateAsync(req.params);
			const userId = req?.params?.userId;
			const roles = req?.user?.role;

			if (!userId) {
				throw new Error("No user ID in request");
			}

			if (!roles || roles.length === 0) {
				throw new Error("No roles in request");
			}

			const user = await this.db.getUserById(roles, userId);

			return res.success({ msg: "ok", data: user });
		},
		SERVICE_NAME,
		"getUserById"
	);

	editUserById = asyncHandler(
		async (req, res, next) => {
			const roles = req?.user?.role;
			if (!roles.includes("superadmin")) {
				throw createError("Unauthorized", 403);
			}

			const userId = req.params.userId;
			const user = { ...req.body };

			await editUserByIdParamValidation.validateAsync(req.params);
			// If this is superadmin self edit, allow "superadmin" role
			if (userId === req.user._id) {
				await editSuperadminUserByIdBodyValidation.validateAsync(req.body);
			} else {
				await editUserByIdBodyValidation.validateAsync(req.body);
			}

			await this.db.editUserById(userId, user);
			return res.success({ msg: "ok" });
		},
		SERVICE_NAME,
		"editUserById"
	);
}

export default AuthController;
