import jwt from "jsonwebtoken";
import ServiceRegistry from "../service/system/serviceRegistry.js";
import SettingsService from "../service/system/settingsService.js";
import StringService from "../service/system/stringService.js";
const SERVICE_NAME = "verifyJWT";
const TOKEN_PREFIX = "Bearer ";

/**
 * Verifies the JWT token
 * @function
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 * @returns {express.Response}
 */
const verifyJWT = (req, res, next) => {
	const stringService = ServiceRegistry.get(StringService.SERVICE_NAME);

	// Check for token in cookies first, then Authorization header
	let parsedToken;
	const cookieToken = req.cookies?.authToken;
	const headerToken = req.headers["authorization"];

	if (cookieToken) {
		// Token found in httpOnly cookie (preferred method)
		parsedToken = cookieToken;
	} else if (headerToken) {
		// Fallback to Authorization header for backward compatibility
		if (!headerToken.startsWith(TOKEN_PREFIX)) {
			const error = new Error(stringService.invalidAuthToken);
			error.status = 401;
			error.service = SERVICE_NAME;
			error.method = "verifyJWT";
			next(error);
			return;
		}
		parsedToken = headerToken.slice(TOKEN_PREFIX.length, headerToken.length);
	} else {
		// No token found in either location
		const error = new Error(stringService.noAuthToken);
		error.status = 401;
		error.service = SERVICE_NAME;
		next(error);
		return;
	}
	// Verify the token's authenticity
	const { jwtSecret } = ServiceRegistry.get(SettingsService.SERVICE_NAME).getSettings();
	jwt.verify(parsedToken, jwtSecret, (err, decoded) => {
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
