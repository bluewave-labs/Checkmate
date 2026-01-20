import { logger } from "../../utils/logger.js";

const handleErrors = (error, req, res, next) => {
	const status = error.status || 500;
	const message = error.message || "Server error";
	const service = error.service || "unknownService";
	logger.error({
		message: message,
		service: service,
		method: error.method,
		stack: error.stack,
	});
	res.error({
		status,
		msg: message,
	});
};

export { handleErrors };
