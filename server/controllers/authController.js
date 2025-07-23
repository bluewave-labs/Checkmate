import {
	registrationBodyValidation,
	loginValidation,
	editUserBodyValidation,
	recoveryValidation,
	recoveryTokenBodyValidation,
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

	checkSuperadminExists = asyncHandler(
		async (req, res, next) => {
			const superAdminExists = await this.userService.checkSuperadminExists();
			return res.success({
				msg: this.stringService.authAdminExists,
				data: superAdminExists,
			});
		},
		SERVICE_NAME,
		"checkSuperadminExists"
	);

	requestRecovery = asyncHandler(
		async (req, res, next) => {
			await recoveryValidation.validateAsync(req.body);
			const email = req?.body?.email;
			const msgId = await this.userService.requestRecovery(email);
			return res.success({
				msg: this.stringService.authCreateRecoveryToken,
				data: msgId,
			});
		},
		SERVICE_NAME,
		"requestRecovery"
	);

	validateRecovery = asyncHandler(
		async (req, res, next) => {
			await recoveryTokenBodyValidation.validateAsync(req.body);
			await this.userService.validateRecovery(req.body.recoveryToken);
			return res.success({
				msg: this.stringService.authVerifyRecoveryToken,
			});
		},
		SERVICE_NAME,
		"validateRecovery"
	);

	resetPassword = asyncHandler(
		async (req, res, next) => {
			await newPasswordValidation.validateAsync(req.body);
			const { user, token } = await this.userService.resetPassword(req.body.password, req.body.recoveryToken);
			return res.success({
				msg: this.stringService.authResetPassword,
				data: { user, token },
			});
		},
		SERVICE_NAME,
		"resetPassword"
	);

	deleteUser = asyncHandler(
		async (req, res, next) => {
			await this.userService.deleteUser(req.user);
			return res.success({
				msg: this.stringService.authDeleteUser,
			});
		},
		SERVICE_NAME,
		"deleteUser"
	);

	getAllUsers = asyncHandler(
		async (req, res, next) => {
			const allUsers = await this.userService.getAllUsers();
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

			const user = await this.userService.getUserById(roles, userId);

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

			await this.userService.editUserById(userId, user);
			return res.success({ msg: "ok" });
		},
		SERVICE_NAME,
		"editUserById"
	);
}

export default AuthController;
