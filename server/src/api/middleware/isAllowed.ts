import type { Request, Response, NextFunction } from "express";
const SERVICE_NAME = "allowedRoles";
import { AppError, internalError } from "@/utils/AppError.js";
import type { UserRole } from "@/domain/users/user.type.js";
import { middlewareErrors } from "@/api/middleware/middleware.errors.js";

const isAllowed = (allowedRoles: UserRole[]) => {
	return (req: Request, res: Response, next: NextFunction) => {
		try {
			const user = req.user;
			if (!user) {
				throw new AppError(internalError, {
					message: "Role check ran without an authenticated user; verifyJWT must run before isAllowed",
					service: SERVICE_NAME,
					method: "isAllowed",
				});
			}
			const userRoles = req.user?.role || [];

			// Check if the user has the required role
			if (userRoles.some((role) => allowedRoles.includes(role))) {
				next();
				return;
			} else {
				throw new AppError(middlewareErrors.forbidden, { service: SERVICE_NAME, method: "isAllowed" });
			}
		} catch (error) {
			next(error);
			return;
		}
	};
};

export { isAllowed };
