import { NextFunction, Request, Response } from "express";

import jwt from "jsonwebtoken";
import { AppError } from "@/utils/AppError.js";
import { Settings } from "@/types/settings.js";
import type { User } from "@/types/user.js";

const SERVICE_NAME = "verifyJWT";
const TOKEN_PREFIX = "Bearer ";

const isUser = (payload: unknown): payload is User => {
	return typeof payload === "object" && payload !== null && "id" in payload && "teamId" in payload && "role" in payload;
};

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
		jwt.verify(parsedToken, jwtSecret, (err: jwt.VerifyErrors | null, decoded: jwt.JwtPayload | string | undefined) => {
			if (err) {
				const error = new AppError({
					message: err instanceof Error ? err.message : "Failed to authenticate token",
					status: 401,
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
				next(new AppError({ message: "Invalid token payload", status: 401, service: SERVICE_NAME, method: "verifyJWT" }));
			}
		});
	};
};
