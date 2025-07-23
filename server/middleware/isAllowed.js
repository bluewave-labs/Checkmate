import jwt from "jsonwebtoken";
const TOKEN_PREFIX = "Bearer ";
const SERVICE_NAME = "allowedRoles";
import ServiceRegistry from "../service/serviceRegistry.js";
import StringService from "../service/stringService.js";
import SettingsService from "../service/settingsService.js";

const isAllowed = (allowedRoles) => {
	return (req, res, next) => {
		const token = req.headers["authorization"];
		const stringService = ServiceRegistry.get(StringService.SERVICE_NAME);
		// If no token is pressent, return an error
		if (!token) {
			const error = new Error(stringService.noAuthToken);
			error.status = 401;
			error.service = SERVICE_NAME;
			next(error);
			return;
		}

		// If the token is improperly formatted, return an error
		if (!token.startsWith(TOKEN_PREFIX)) {
			const error = new Error(stringService.invalidAuthToken);
			error.status = 400;
			error.service = SERVICE_NAME;
			next(error);
			return;
		}
		// Parse the token
		try {
			const parsedToken = token.slice(TOKEN_PREFIX.length, token.length);
			const { jwtSecret } = ServiceRegistry.get(SettingsService.SERVICE_NAME).getSettings();
			var decoded = jwt.verify(parsedToken, jwtSecret);
			const userRoles = decoded.role;

			// Check if the user has the required role
			if (userRoles.some((role) => allowedRoles.includes(role))) {
				next();
				return;
			} else {
				const error = new Error(stringService.insufficientPermissions);
				error.status = 403;
				error.service = SERVICE_NAME;
				next(error);
				return;
			}
		} catch (error) {
			error.status = 401;
			error.method = "isAllowed";
			error.service = SERVICE_NAME;
			next(error);
			return;
		}
	};
};

export { isAllowed };
