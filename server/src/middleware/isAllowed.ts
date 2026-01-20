import type { Request, Response, NextFunction } from "express";
const SERVICE_NAME = "allowedRoles";
import { AppError } from "@/utils/AppError.js";
import type { UserRole } from "@/types/index.js";

const isAllowed = (allowedRoles: UserRole[]) => {
	return (req: Request, res: Response, next: NextFunction) => {
		try {
			const user = req.user;
			if (!user) {
				throw new AppError({ message: "Unauthorized", status: 403, service: SERVICE_NAME });
			}
			const userRoles = req.user?.role || [];

			// Check if the user has the required role
			if (userRoles.some((role) => allowedRoles.includes(role))) {
				next();
				return;
			} else {
				throw new AppError({ message: "Unauthorized", status: 403, service: SERVICE_NAME });
			}
		} catch (error) {
			next(error);
			return;
		}
	};
};

export { isAllowed };
