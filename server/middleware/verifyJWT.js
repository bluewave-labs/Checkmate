import jwt from "jsonwebtoken";
import ServiceRegistry from "../service/serviceRegistry.js";
import SettingsService from "../service/settingsService.js";
import StringService from "../service/stringService.js";
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
	const token = req.headers["authorization"];
	// Make sure a token is provided
	if (!token) {
		const error = new Error(stringService.noAuthToken);
		error.status = 401;
		error.service = SERVICE_NAME;
		next(error);
		return;
	}
	// Make sure it is properly formatted
	if (!token.startsWith(TOKEN_PREFIX)) {
		const error = new Error(stringService.invalidAuthToken); // Instantiate a new Error object for improperly formatted token
		error.status = 401;
		error.service = SERVICE_NAME;
		error.method = "verifyJWT";
		next(error);
		return;
	}

	const parsedToken = token.slice(TOKEN_PREFIX.length, token.length);
	// Verify the token's authenticity
	const { jwtSecret } = ServiceRegistry.get(SettingsService.SERVICE_NAME).getSettings();
	jwt.verify(parsedToken, jwtSecret, (err, decoded) => {
		if (err) {
			const errorMessage =
				err.name === "TokenExpiredError"
					? stringService.expiredAuthToken
					: stringService.invalidAuthToken;
			return res.status(401).json({ success: false, msg: errorMessage });
		}
		
		// Token is valid, carry on
		req.user = decoded;
		next();
	});
};

export { verifyJWT };
