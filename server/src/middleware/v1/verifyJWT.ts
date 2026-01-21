import { NextFunction, Request, Response } from "express";

import jwt from "jsonwebtoken";
import ServiceRegistry from "../../service/system/serviceRegistry.js";
import SettingsService from "../../service/system/settingsService.js";
import StringService from "../../service/system/stringService.js";
const SERVICE_NAME = "verifyJWT";
const TOKEN_PREFIX = "Bearer ";

const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
	const stringService = ServiceRegistry.get(StringService.SERVICE_NAME);
	const token = req.headers["authorization"];
	// Make sure a token is provided
	if (!token) {
		const error: any = new Error(stringService.noAuthToken);
		error.status = 401;
		error.service = SERVICE_NAME;
		next(error);
		return;
	}
	// Make sure it is properly formatted
	if (!token.startsWith(TOKEN_PREFIX)) {
		const error: any = new Error(stringService.invalidAuthToken); // Instantiate a new Error object for improperly formatted token
		error.status = 401;
		error.service = SERVICE_NAME;
		error.method = "verifyJWT";
		next(error);
		return;
	}

	const parsedToken = token.slice(TOKEN_PREFIX.length, token.length);
	// Verify the token's authenticity
	const { jwtSecret } = ServiceRegistry.get(SettingsService.SERVICE_NAME).getSettings();
	jwt.verify(parsedToken, jwtSecret, (err: any, decoded: any) => {
		if (err) {
			const errorMessage = err.name === "TokenExpiredError" ? stringService.expiredAuthToken : stringService.invalidAuthToken;
			err.details = { msg: errorMessage };
			err.status = 401;
			err.service = SERVICE_NAME;
			err.method = "verifyJWT";
			next(err);
			return;
		} else {
			// Token is valid, carry on
			req.user = decoded;
			next();
		}
	});
};

export { verifyJWT };
