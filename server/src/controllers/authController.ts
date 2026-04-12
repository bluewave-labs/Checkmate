import { Request, Response, NextFunction } from "express";
import { AppError } from "@/utils/AppError.js";
import { requireTeamId, requireUserEmail, requireUserId, requireUserRoles } from "@/controllers/controllerUtils.js";

import {
	registrationBodyValidation,
	loginValidation,
	recoveryValidation,
	recoveryTokenBodyValidation,
	newPasswordValidation,
} from "@/validation/authValidation.js";

import {
	editUserBodyValidation,
	createUserBodyValidation,
	getUserByIdParamValidation,
	editUserByIdParamValidation,
	editUserByIdBodyValidation,
	editSuperadminUserByIdBodyValidation,
	editUserPasswordByIdBodyValidation,
} from "@/validation/userValidation.js";
import { IUserService } from "@/service/index.js";

const SERVICE_NAME = "authController";

export interface IAuthController {
	registerUser(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	createUser(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	loginUser(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	editUser(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	checkSuperadminExists(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	requestRecovery(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	validateRecovery(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	resetPassword(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	deleteUser(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	deleteUserById(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	getAllUsers(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	getUserById(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	editUserById(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	editUserPasswordById(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
}

class AuthController implements IAuthController {
	static SERVICE_NAME = SERVICE_NAME;

	private userService: IUserService;

	constructor(userService: IUserService) {
		this.userService = userService;
	}

	get serviceName() {
		return AuthController.SERVICE_NAME;
	}

	registerUser = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const newUser = req.body.user;
			const newUserToken = req.body.token;
			if (newUser?.email) {
				const newUserEmail = requireUserEmail(newUser.email);
				newUser.email = newUserEmail.toLowerCase();
			}
			const validatedBody = registrationBodyValidation.parse(newUser);

			const { user, token } = await this.userService.registerUser(validatedBody, newUserToken, req?.file ?? null);
			res.status(200).json({
				success: true,
				msg: "User registered successfully",
				data: { user, token },
			});
		} catch (error) {
			next(error);
		}
	};

	createUser = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const userData = req.body;
			if (userData?.email) {
				userData.email = userData.email.toLowerCase();
			}
			const validatedBody = createUserBodyValidation.parse(userData);

			const teamId = requireTeamId(req.user?.teamId);
			const actorRoles = requireUserRoles(req.user?.role);
			const newUser = await this.userService.createUser(validatedBody, teamId, actorRoles, req?.file ?? null);
			res.status(201).json({
				success: true,
				msg: "User created successfully",
				data: newUser,
			});
		} catch (error) {
			next(error);
		}
	};

	loginUser = async (req: Request, res: Response, next: NextFunction) => {
		try {
			if (req.body?.email) {
				req.body.email = req.body.email?.toLowerCase();
			}
			loginValidation.parse(req.body);
			const { user, token } = await this.userService.loginUser(req.body.email, req.body.password);

			return res.status(200).json({
				success: true,
				msg: "User logged in successfully",
				data: {
					user,
					token,
				},
			});
		} catch (error) {
			next(error);
		}
	};

	editUser = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const validatedBody = editUserBodyValidation.parse(req.body);
			const userId = requireUserId(req.user?.id);
			const userEmail = requireUserEmail(req.user?.email);
			const updatedUser = await this.userService.editUser(validatedBody, req?.file ?? null, userId, userEmail);

			res.status(200).json({
				success: true,
				msg: "User updated successfully",
				data: updatedUser,
			});
		} catch (error) {
			next(error);
		}
	};

	checkSuperadminExists = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const superAdminExists = await this.userService.checkSuperadminExists();
			return res.status(200).json({
				success: true,
				msg: "Superadmin existence checked successfully",
				data: superAdminExists,
			});
		} catch (error) {
			next(error);
		}
	};

	requestRecovery = async (req: Request, res: Response, next: NextFunction) => {
		try {
			recoveryValidation.parse(req.body);
			const email = req?.body?.email;
			const msgId = await this.userService.requestRecovery(email);
			return res.status(200).json({
				success: true,
				msg: "Password recovery email sent successfully",
				data: msgId,
			});
		} catch (error) {
			next(error);
		}
	};

	validateRecovery = async (req: Request, res: Response, next: NextFunction) => {
		try {
			recoveryTokenBodyValidation.parse(req.body);
			await this.userService.validateRecovery(req.body.recoveryToken);
			return res.status(200).json({
				success: true,
				msg: "Recovery token is valid",
			});
		} catch (error) {
			next(error);
		}
	};

	resetPassword = async (req: Request, res: Response, next: NextFunction) => {
		try {
			newPasswordValidation.parse(req.body);
			const { user, token } = await this.userService.resetPassword(req.body.password, req.body.recoveryToken);
			return res.status(200).json({
				success: true,
				msg: "Password has been reset successfully",
				data: { user, token },
			});
		} catch (error) {
			next(error);
		}
	};

	deleteUser = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const userId = requireUserId(req.user?.id);
			const teamId = requireTeamId(req.user?.teamId);
			const roles = requireUserRoles(req.user?.role);

			await this.userService.deleteUser({
				userId,
				teamId,
				roles,
			});
			return res.status(200).json({
				success: true,
				msg: "User deleted successfully",
			});
		} catch (error) {
			next(error);
		}
	};

	deleteUserById = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const validatedParams = getUserByIdParamValidation.parse(req.params);
			const targetUserId = validatedParams.userId;
			const actorId = requireUserId(req.user?.id);
			const actorTeamId = requireTeamId(req.user?.teamId);
			const actorRoles = requireUserRoles(req.user?.role);
			await this.userService.deleteUserById({ actorId, actorTeamId, actorRoles, targetUserId });
			return res.status(200).json({
				success: true,
				msg: "User removed successfully",
			});
		} catch (error) {
			next(error);
		}
	};

	getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const allUsers = await this.userService.getAllUsers();
			return res.status(200).json({
				success: true,
				msg: "Users retrieved successfully",
				data: allUsers,
			});
		} catch (error) {
			next(error);
		}
	};

	getUserById = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const validatedParams = getUserByIdParamValidation.parse(req.params);
			const actorRoles = requireUserRoles(req.user?.role);
			const user = await this.userService.getUserById(actorRoles, validatedParams.userId);

			return res.status(200).json({ success: true, msg: "ok", data: user });
		} catch (error) {
			next(error);
		}
	};

	editUserById = async (req: Request, res: Response, next: NextFunction) => {
		try {
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
			return res.status(200).json({ success: true, msg: "ok" });
		} catch (error) {
			next(error);
		}
	};

	editUserPasswordById = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const actorRoles = requireUserRoles(req.user?.role);
			if (!actorRoles.includes("superadmin")) {
				throw new AppError({ message: "Unauthorized", status: 403 });
			}

			const validatedParams = editUserByIdParamValidation.parse(req.params);
			const validatedBody = editUserPasswordByIdBodyValidation.parse(req.body);
			await this.userService.setPasswordByUserId(validatedParams.userId, validatedBody.password);
			return res.status(200).json({ success: true, msg: "Password reset successfully" });
		} catch (error) {
			next(error);
		}
	};
}

export default AuthController;
