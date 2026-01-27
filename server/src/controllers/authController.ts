import { Request, Response, NextFunction } from "express";
import { AppError } from "@/utils/AppError.js";

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
	editUserPasswordByIdBodyValidation,
} from "@/validation/joi.js";

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
			await registrationBodyValidation.validateAsync(newUser);

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

	loginUser = async (req: Request, res: Response, next: NextFunction) => {
		try {
			if (req.body?.email) {
				req.body.email = req.body.email?.toLowerCase();
			}
			await loginValidation.validateAsync(req.body);
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
			await editUserBodyValidation.validateAsync(req.body);

			const updatedUser = await this.userService.editUser(req.body, req.file, req.user);

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
			await recoveryValidation.validateAsync(req.body);
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
			await recoveryTokenBodyValidation.validateAsync(req.body);
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
			await newPasswordValidation.validateAsync(req.body);
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

			await editUserByIdParamValidation.validateAsync(req.params);
			// If this is superadmin self edit, allow "superadmin" role
			if (userId === req.user?.id) {
				await editSuperadminUserByIdBodyValidation.validateAsync(req.body);
			} else {
				await editUserByIdBodyValidation.validateAsync(req.body);
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
			await editUserByIdParamValidation.validateAsync(req.params);
			await editUserPasswordByIdBodyValidation.validateAsync(req.body);
			const updatedPassword = req.body.password;
			await this.userService.setPasswordByUserId(userId, updatedPassword);
			return res.status(200).json({ success: true, msg: "Password reset successfully" });
		} catch (error) {
			next(error);
		}
	};
}

export default AuthController;
