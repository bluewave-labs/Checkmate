import { Request, Response, NextFunction } from "express";
import { AppError } from "@/utils/AppError.js";
import { requireTeamId, requireUserRoles } from "./controllerUtils.js";
import type { UserRole } from "@/types/user.js";

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

const SERVICE_NAME = "authController";

class AuthController {
	static SERVICE_NAME = SERVICE_NAME;

	private userService: any;

	constructor(userService: any) {
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
				newUser.email = newUser.email.toLowerCase();
			}
			registrationBodyValidation.parse(newUser);

			const { user, token } = await this.userService.registerUser(newUser, newUserToken, req.file);
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
			createUserBodyValidation.parse(userData);

			const teamId = requireTeamId(req.user?.teamId);
			const actorRoles = requireUserRoles(req.user?.role) as UserRole[];
			const newUser = await this.userService.createUser(userData, teamId, actorRoles, req.file);
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
			const updatedUser = await this.userService.editUser(validatedBody, req.file, req.user);

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
			await this.userService.deleteUser(req.user);
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
			getUserByIdParamValidation.parse(req.params);
			const targetUserId = req.params.userId;
			await this.userService.deleteUserById(req.user, targetUserId);
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
			getUserByIdParamValidation.parse(req.params);
			const userId = req?.params?.userId;
			const roles = req?.user?.role;

			if (!userId) {
				throw new Error("No user ID in request");
			}

			if (!roles || roles.length === 0) {
				throw new Error("No roles in request");
			}

			const user = await this.userService.getUserById(roles, userId);

			return res.status(200).json({ success: true, msg: "ok", data: user });
		} catch (error) {
			next(error);
		}
	};

	editUserById = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const roles = req?.user?.role;

			if (!roles || !roles.includes("superadmin")) {
				throw new AppError({ message: "Unauthorized", status: 403 });
			}

			const userId = req.params.userId as string;
			const user = { ...req.body };

			editUserByIdParamValidation.parse(req.params);
			// If this is superadmin self edit, allow "superadmin" role
			if (userId === req.user?.id) {
				editSuperadminUserByIdBodyValidation.parse(req.body);
			} else {
				editUserByIdBodyValidation.parse(req.body);
			}

			await this.userService.editUserById(userId, user);
			return res.status(200).json({ success: true, msg: "ok" });
		} catch (error) {
			next(error);
		}
	};

	editUserPasswordById = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const roles = req?.user?.role;
			if (!roles || !roles.includes("superadmin")) {
				throw new AppError({ message: "Unauthorized", status: 403 });
			}

			const userId = req.params.userId as string;
			editUserByIdParamValidation.parse(req.params);
			editUserPasswordByIdBodyValidation.parse(req.body);
			const updatedPassword = req.body.password;
			await this.userService.setPasswordByUserId(userId, updatedPassword);
			return res.status(200).json({ success: true, msg: "Password reset successfully" });
		} catch (error) {
			next(error);
		}
	};
}

export default AuthController;
