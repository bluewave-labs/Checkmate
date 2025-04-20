import logger from "../utils/logger.js";
import ServiceRegistry from "../service/serviceRegistry.js";
import StringService from "../service/stringService.js";

const handleErrors = (error, req, res, next) => {
	const status = error.status || 500;
	const stringService = ServiceRegistry.get(StringService.SERVICE_NAME);
	const message = error.message || stringService.friendlyError;
	const service = error.service || stringService.unknownService;
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
