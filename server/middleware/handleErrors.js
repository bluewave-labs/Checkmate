import logger from "../utils/logger.js";
import ServiceRegistry from "../service/system/serviceRegistry.js";
import StringService from "../service/system/stringService.js";

const handleErrors = (error, req, res, next) => {
	console.log("ERROR", error);
	const status = error.status || 500;
	const stringService = ServiceRegistry.get(StringService.SERVICE_NAME);
	const message = error.message || stringService.authIncorrectPassword;
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
