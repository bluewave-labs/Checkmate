/**
 * Middleware that adds standardized response methods to the Express response object.
 * This allows for consistent API responses throughout the application.
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 */
const responseHandler = (req, res, next) => {
	/**
	 * Sends a standardized success response
	 *
	 * @param {Object} options - Success response options
	 * @param {number} [options.status=200] - HTTP status code
	 * @param {string} [options.msg="OK"] - Success message
	 * @param {*} [options.data=null] - Response data payload
	 * @returns {Object} Express response object
	 */
	res.success = ({ status = 200, msg = "OK", data = null }) => {
		return res.status(status).json({
			success: true,
			msg: msg,
			data: data,
		});
	};

	/**
	 * Sends a standardized error response
	 *
	 * @param {Object} options - Error response options
	 * @param {number} [options.status=500] - HTTP status code
	 * @param {string} [options.msg="Internal server error"] - Error message
	 * @param {*} [options.data=null] - Additional error data (if any)
	 * @returns {Object} Express response object
	 */
	res.error = ({ status = 500, msg = "Internal server error", data = null }) => {
		return res.status(status).json({
			success: false,
			msg,
			data,
		});
	};
	next();
};

export { responseHandler };
