const jwt = require("jsonwebtoken");
const TOKEN_PREFIX = "Bearer ";
const SERVICE_NAME = "allowedRoles";
const { errorMessages } = require("../utils/messages");

const isAllowed = (allowedRoles) => {
  return (req, res, next) => {
    const token = req.headers["authorization"];

    // If no token is pressent, return an error
    if (!token) {
      const error = new Error(errorMessages.NO_AUTH_TOKEN);
      error.status = 401;
      error.service = SERVICE_NAME;
      next(error);
      return;
    }

    // If the token is improperly formatted, return an error
    if (!token.startsWith(TOKEN_PREFIX)) {
      const error = new Error(errorMessages.INVALID_AUTH_TOKEN);
      error.status = 400;
      error.service = SERVICE_NAME;
      next(error);
      return;
    }
    // Parse the token
    try {
      const parsedToken = token.slice(TOKEN_PREFIX.length, token.length);
      var decoded = jwt.verify(parsedToken, process.env.JWT_SECRET);
      const userRoles = decoded.role;

      // Check if the user has the required role
      if (userRoles.some((role) => allowedRoles.includes(role))) {
        next();
        return;
      } else {
        const error = new Error(errorMessages.INSUFFICIENT_PERMISSIONS);
        error.status = 401;
        error.service = SERVICE_NAME;
        next(error);
        return;
      }
    } catch (error) {
      error.status = 401;
      error.service = SERVICE_NAME;
      next(error);
      return;
    }
  };
};

module.exports = { isAllowed };
