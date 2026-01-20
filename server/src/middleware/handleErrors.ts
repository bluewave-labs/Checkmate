import type { NextFunction, Request, Response } from "express";
import { logger } from "@/utils/logger.js";

const handleErrors = (error: any, req: Request, res: Response, next: NextFunction) => {
	const status = error.status || 500;
	const message = error.message || "Server error";
	const service = error.service || "unknownService";
	logger.error({
		message: message,
		service: service,
		method: error.method,
		stack: error.stack,
	});
	res.status(status).json({
		status,
		msg: message,
	});
};

export { handleErrors };
