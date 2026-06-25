import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import type { ILogger } from "@/utils/logger.js";
import { AppError } from "@/utils/AppError.js";

// Multer throws MulterError, send 413 Payload Too Large / 400
const multerErrorStatus = (error: MulterError): number => (error.code === "LIMIT_FILE_SIZE" ? 413 : 400);

const handleErrors = (logger: ILogger) => (error: unknown, req: Request, res: Response, _next: NextFunction) => {
	const status = error instanceof MulterError ? multerErrorStatus(error) : error instanceof AppError ? error.status || 500 : 500;
	const message = error instanceof AppError ? error.message : error instanceof Error ? error.message : "Server error";
	const service = error instanceof AppError ? error.service : error instanceof MulterError ? "uploadMiddleware" : "unknownService";
	const method = error instanceof AppError ? error.method : "unknownMethod";
	logger.error({
		message: message,
		service: service,
		method: method,
		stack: error instanceof Error ? error.stack : undefined,
		details: error instanceof AppError ? error.details : undefined,
	});
	res.status(status).json({
		status,
		msg: message,
	});
};

export { handleErrors };
