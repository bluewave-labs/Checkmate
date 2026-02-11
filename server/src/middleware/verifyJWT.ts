import { NextFunction, Request, Response } from "express";

import jwt from "jsonwebtoken";
import { AppError } from "@/utils/AppError.js";
import { Settings } from "@/types/settings.js";

const SERVICE_NAME = "verifyJWT";
const TOKEN_PREFIX = "Bearer ";

export const createVerifyJWT = (settingsService: { getSettings: () => Settings }) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const token = req.headers["authorization"];
		// Make sure a token is provided
		if (!token) {
			const error = new AppError({ message: "No token provided", status: 401, service: SERVICE_NAME });
			next(error);
			return;
		}
		// Make sure it is properly formatted
		if (!token.startsWith(TOKEN_PREFIX)) {
			const error = new AppError({ message: "Invalid token format", status: 401, service: SERVICE_NAME, method: "verifyJWT" });
			next(error);
			return;
		}

		const parsedToken = token.slice(TOKEN_PREFIX.length, token.length);
		// Verify the token's authenticity
		const { jwtSecret } = settingsService.getSettings();
		if (!jwtSecret) {
			const error = new AppError({ message: "JWT secret not configured", status: 500, service: SERVICE_NAME });
			next(error);
			return;
		}
		jwt.verify(parsedToken, jwtSecret, (err: any, decoded: any) => {
			if (err) {
				const error = new AppError({
					message: "Failed to authenticate token",
					details: err,
					status: 401,
					service: SERVICE_NAME,
					method: "verifyJWT",
				});
				next(error);
				return;
			} else {
				// Token is valid, carry on
				req.user = decoded;
				next();
			}
		});
	};
};
