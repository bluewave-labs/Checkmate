import { NextFunction, Request, Response } from "express";

import jwt from "jsonwebtoken";
import { AppError, internalError } from "@/utils/AppError.js";
import { middlewareErrors } from "@/api/middleware/middleware.errors.js";
import type { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import type { User } from "@/domain/users/user.type.js";

const SERVICE_NAME = "verifyJWT";
const TOKEN_PREFIX = "Bearer ";

const isUser = (payload: unknown): payload is User => {
	return typeof payload === "object" && payload !== null && "id" in payload && "teamId" in payload && "role" in payload;
};

export const createVerifyJWT = (settingsService: ISettingsService) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const token = req.headers["authorization"];
		// Make sure a token is provided
		if (!token) {
			const error = new AppError(middlewareErrors.unauthenticated, { message: "No token provided", service: SERVICE_NAME, method: "verifyJWT" });
			next(error);
			return;
		}
		// Make sure it is properly formatted
		if (!token.startsWith(TOKEN_PREFIX)) {
			const error = new AppError(middlewareErrors.unauthenticated, { message: "Invalid token format", service: SERVICE_NAME, method: "verifyJWT" });
			next(error);
			return;
		}

		const parsedToken = token.slice(TOKEN_PREFIX.length, token.length);
		// Verify the token's authenticity
		const { jwtSecret } = settingsService.getSettings();
		if (!jwtSecret) {
			const error = new AppError(internalError, { message: "JWT secret not configured", service: SERVICE_NAME, method: "verifyJWT" });
			next(error);
			return;
		}
		jwt.verify(parsedToken, jwtSecret, (err: jwt.VerifyErrors | null, decoded: jwt.JwtPayload | string | undefined) => {
			if (err) {
				const error = new AppError(middlewareErrors.unauthenticated, {
					message: err instanceof Error ? err.message : "Failed to authenticate token",
					service: SERVICE_NAME,
					details: err instanceof Error ? { error: err } : undefined,
					method: "verifyJWT",
				});
				next(error);
				return;
			} else if (isUser(decoded)) {
				req.user = decoded;
				next();
			} else {
				next(new AppError(middlewareErrors.unauthenticated, { message: "Invalid token payload", service: SERVICE_NAME, method: "verifyJWT" }));
			}
		});
	};
};
