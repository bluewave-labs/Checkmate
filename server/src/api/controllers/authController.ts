import { RequestHandler } from "express";
import { AppError } from "@/utils/AppError.js";
import { Handler, requireTeamId, requireUserEmail, requireUserId, requireUserRoles } from "@/api/controllers/controllerUtils.js";

import {
	registrationBodyValidation,
	registerInviteTokenValidation,
	loginValidation,
	recoveryValidation,
	recoveryTokenBodyValidation,
	newPasswordValidation,
} from "@/api/validation/authValidation.js";

import {
	editUserBodyValidation,
	createUserBodyValidation,
	getUserByIdParamValidation,
	editUserByIdParamValidation,
	editUserByIdBodyValidation,
	editSuperadminUserByIdBodyValidation,
	editUserPasswordByIdBodyValidation,
} from "@/api/validation/userValidation.js";
import { IUserService } from "@/domain/users/user.service.js";

export interface IAuthController {
	registerUser: RequestHandler;
	createUser: RequestHandler;
	loginUser: RequestHandler;
	editUser: RequestHandler;
	checkSuperadminExists: RequestHandler;
	requestRecovery: RequestHandler;
	validateRecovery: RequestHandler;
	resetPassword: RequestHandler;
	deleteUser: RequestHandler;
	deleteUserById: RequestHandler;
	getAllUsers: RequestHandler;
	getUserById: RequestHandler;
	editUserById: RequestHandler;
	editUserPasswordById: RequestHandler;
}

class AuthController implements IAuthController {
	private userService: IUserService;

	constructor(userService: IUserService) {
		this.userService = userService;
	}

	registerUser: Handler = async (req, res) => {
		const newUserToken = registerInviteTokenValidation.parse(req.body.token);
		const validatedBody = registrationBodyValidation.parse(req.body.user);
		const { user, token } = await this.userService.registerUser(validatedBody, newUserToken, req?.file ?? null);
		res.json({ success: true, msg: "User registered successfully", data: { user, token } });
	};

	createUser: Handler = async (req, res) => {
		const validatedBody = createUserBodyValidation.parse(req.body);

		const teamId = requireTeamId(req.user?.teamId);
		const actorRoles = requireUserRoles(req.user?.role);
		const newUser = await this.userService.createUser(validatedBody, teamId, actorRoles, req?.file ?? null);
		res.status(201).json({ success: true, msg: "User created successfully", data: newUser });
	};

	loginUser: Handler = async (req, res) => {
		const { email, password } = loginValidation.parse(req.body);
		const { user, token } = await this.userService.loginUser(email, password);
		const data = { user, token };
		res.json({ success: true, msg: "User logged in successfully", data });
	};

	editUser: Handler = async (req, res) => {
		const validatedBody = editUserBodyValidation.parse(req.body);
		const userId = requireUserId(req.user?.id);
		const userEmail = requireUserEmail(req.user?.email);
		const updatedUser = await this.userService.editUser(validatedBody, req?.file ?? null, userId, userEmail);

		res.json({ success: true, msg: "User updated successfully", data: updatedUser });
	};

	checkSuperadminExists: Handler = async (req, res) => {
		const superAdminExists = await this.userService.checkSuperadminExists();
		res.json({ success: true, msg: "Superadmin existence checked successfully", data: superAdminExists });
	};

	requestRecovery: Handler = async (req, res) => {
		const { email } = recoveryValidation.parse(req.body);
		await this.userService.requestRecovery(email);
		res.json({ success: true, msg: "Password recovery email sent successfully" });
	};

	validateRecovery: Handler = async (req, res) => {
		const { recoveryToken } = recoveryTokenBodyValidation.parse(req.body);
		await this.userService.validateRecovery(recoveryToken);
		res.json({ success: true, msg: "Recovery token is valid" });
	};

	resetPassword: Handler = async (req, res) => {
		const { password, recoveryToken } = newPasswordValidation.parse(req.body);
		const { user, token } = await this.userService.resetPassword(password, recoveryToken);
		res.json({ success: true, msg: "Password has been reset successfully", data: { user, token } });
	};

	deleteUser: Handler = async (req, res) => {
		const userId = requireUserId(req.user?.id);
		const teamId = requireTeamId(req.user?.teamId);
		const roles = requireUserRoles(req.user?.role);

		await this.userService.deleteUser({
			userId,
			teamId,
			roles,
		});
		res.json({ success: true, msg: "User deleted successfully" });
	};

	deleteUserById: Handler = async (req, res) => {
		const validatedParams = getUserByIdParamValidation.parse(req.params);
		const targetUserId = validatedParams.userId;
		const actorId = requireUserId(req.user?.id);
		const actorTeamId = requireTeamId(req.user?.teamId);
		const actorRoles = requireUserRoles(req.user?.role);
		await this.userService.deleteUserById({ actorId, actorTeamId, actorRoles, targetUserId });
		res.json({ success: true, msg: "User removed successfully" });
	};

	getAllUsers: Handler = async (req, res) => {
		const allUsers = await this.userService.getAllUsers();
		res.json({ success: true, msg: "Users retrieved successfully", data: allUsers });
	};

	getUserById: Handler = async (req, res) => {
		const validatedParams = getUserByIdParamValidation.parse(req.params);
		const actorRoles = requireUserRoles(req.user?.role);
		const user = await this.userService.getUserById(actorRoles, validatedParams.userId);

		res.json({ success: true, msg: "ok", data: user });
	};

	editUserById: Handler = async (req, res) => {
		const actorRoles = requireUserRoles(req.user?.role);
		const actorId = requireUserId(req.user?.id);

		if (!actorRoles.includes("superadmin")) {
			throw new AppError({ message: "Unauthorized", status: 403 });
		}

		const validatedParams = editUserByIdParamValidation.parse(req.params);
		// If this is superadmin self edit, allow "superadmin" role
		const validatedBody =
			validatedParams.userId === actorId ? editSuperadminUserByIdBodyValidation.parse(req.body) : editUserByIdBodyValidation.parse(req.body);

		await this.userService.editUserById(validatedParams.userId, validatedBody);
		res.json({ success: true, msg: "ok" });
	};

	editUserPasswordById: Handler = async (req, res) => {
		const actorRoles = requireUserRoles(req.user?.role);
		if (!actorRoles.includes("superadmin")) {
			throw new AppError({ message: "Unauthorized", status: 403 });
		}

		const validatedParams = editUserByIdParamValidation.parse(req.params);
		const validatedBody = editUserPasswordByIdBodyValidation.parse(req.body);
		await this.userService.setPasswordByUserId(validatedParams.userId, validatedBody.password);
		res.json({ success: true, msg: "Password reset successfully" });
	};
}

export default AuthController;
