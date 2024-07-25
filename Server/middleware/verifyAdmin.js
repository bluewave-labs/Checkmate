const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const SERVICE_NAME = "verifyAdmin";
const TOKEN_PREFIX = "Bearer ";
const { errorMessages } = require("../utils/messages");
/**
 * Verifies the JWT token
 * @function
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 * @returns {express.Response}
 */
const verifyAdmin = (req, res, next) => {
  const token = req.headers["authorization"];
  // Make sure a token is provided
  if (!token) {
    const error = new Error(errorMessages.NO_AUTH_TOKEN);
    error.status = 401;
    error.service = SERVICE_NAME;
    next(error);
    return;
  }
  // Make sure it is properly formatted
  if (!token.startsWith(TOKEN_PREFIX)) {
    const error = new Error(errorMessages.INVALID_AUTH_TOKEN); // Instantiate a new Error object for improperly formatted token
    error.status = 400;
    error.service = SERVICE_NAME;
    next(error);
    return;
  }

  const parsedToken = token.slice(TOKEN_PREFIX.length, token.length);
  // verify admin role is present
  jwt.verify(parsedToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      logger.error(errorMessages.INVALID_AUTH_TOKEN, {
        service: SERVICE_NAME,
      });
      return res
        .status(401)
        .json({ success: false, msg: errorMessages.INVALID_AUTH_TOKEN });
    }

    if (decoded.role.includes("admin") === false) {
      logger.error(errorMessages.INVALID_AUTH_TOKEN, {
        service: SERVICE_NAME,
      });
      return res
        .status(401)
        .json({ success: false, msg: errorMessages.UNAUTHORIZED });
    }
    next();
  });
};

module.exports = { verifyAdmin };
