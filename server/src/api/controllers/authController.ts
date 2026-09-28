import { Request, Response, RequestHandler } from "express";
import { AppError } from "@/utils/AppError.js";
import { requireTeamId, requireUserEmail, requireUserId, requireUserRoles } from "@/api/controllers/controllerUtils.js";

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

	registerUser = async (req: Request, res: Response) => {
		const newUser = req.body.user;
		const newUserToken = registerInviteTokenValidation.parse(req.body.token);
		if (newUser?.email) {
			const newUserEmail = requireUserEmail(newUser.email);
			newUser.email = newUserEmail.toLowerCase();
		}
		const validatedBody = registrationBodyValidation.parse(newUser);
		const { user, token } = await this.userService.registerUser(validatedBody, newUserToken, req?.file ?? null);
		res.json({ success: true, msg: "User registered successfully", data: { user, token } });
	};

	createUser = async (req: Request, res: Response) => {
		const userData = req.body;
		if (userData?.email) {
			userData.email = userData.email.toLowerCase();
		}
		const validatedBody = createUserBodyValidation.parse(userData);

		const teamId = requireTeamId(req.user?.teamId);
		const actorRoles = requireUserRoles(req.user?.role);
		const newUser = await this.userService.createUser(validatedBody, teamId, actorRoles, req?.file ?? null);
		res.json({ success: true, msg: "User created successfully", data: newUser });
	};

	loginUser = async (req: Request, res: Response) => {
		if (req.body?.email) {
			req.body.email = req.body.email?.toLowerCase();
		}
		loginValidation.parse(req.body);
		const { user, token } = await this.userService.loginUser(req.body.email, req.body.password);
		const data = { user, token };
		res.json({ success: true, msg: "User logged in successfully", data });
	};

	editUser = async (req: Request, res: Response) => {
		const validatedBody = editUserBodyValidation.parse(req.body);
		const userId = requireUserId(req.user?.id);
		const userEmail = requireUserEmail(req.user?.email);
		const updatedUser = await this.userService.editUser(validatedBody, req?.file ?? null, userId, userEmail);

		res.json({ success: true, msg: "User updated successfully", data: updatedUser });
	};

	checkSuperadminExists = async (req: Request, res: Response) => {
		const superAdminExists = await this.userService.checkSuperadminExists();
		res.json({ success: true, msg: "Superadmin existence checked successfully", data: superAdminExists });
	};

	requestRecovery = async (req: Request, res: Response) => {
		recoveryValidation.parse(req.body);
		const email = req?.body?.email;
		const msgId = await this.userService.requestRecovery(email);
		res.json({ success: true, msg: "Password recovery email sent successfully", data: msgId });
	};

	validateRecovery = async (req: Request, res: Response) => {
		recoveryTokenBodyValidation.parse(req.body);
		await this.userService.validateRecovery(req.body.recoveryToken);
		res.json({ success: true, msg: "Recovery token is valid" });
	};

	resetPassword = async (req: Request, res: Response) => {
		newPasswordValidation.parse(req.body);
		const { user, token } = await this.userService.resetPassword(req.body.password, req.body.recoveryToken);
		res.json({ success: true, msg: "Password has been reset successfully", data: { user, token } });
	};

	deleteUser = async (req: Request, res: Response) => {
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

	deleteUserById = async (req: Request, res: Response) => {
		const validatedParams = getUserByIdParamValidation.parse(req.params);
		const targetUserId = validatedParams.userId;
		const actorId = requireUserId(req.user?.id);
		const actorTeamId = requireTeamId(req.user?.teamId);
		const actorRoles = requireUserRoles(req.user?.role);
		await this.userService.deleteUserById({ actorId, actorTeamId, actorRoles, targetUserId });
		res.json({ success: true, msg: "User removed successfully" });
	};

	getAllUsers = async (req: Request, res: Response) => {
		const allUsers = await this.userService.getAllUsers();
		res.json({ success: true, msg: "Users retrieved successfully", data: allUsers });
	};

	getUserById = async (req: Request, res: Response) => {
		const validatedParams = getUserByIdParamValidation.parse(req.params);
		const actorRoles = requireUserRoles(req.user?.role);
		const user = await this.userService.getUserById(actorRoles, validatedParams.userId);

		res.json({ success: true, msg: "ok", data: user });
	};

	editUserById = async (req: Request, res: Response) => {
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

	editUserPasswordById = async (req: Request, res: Response) => {
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
