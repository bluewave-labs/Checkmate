import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import type { ILogger } from "@/utils/logger.js";
import { AppError } from "@/utils/AppError.js";
import { ZodError } from "zod";

type ErrorReport = {
	status: number;
	message: string;
	service: string;
	method: string;
	details?: Record<string, unknown>;
};

const formatZodIssues = (error: ZodError): string =>
	error.issues.map((issue) => (issue.path.length > 0 ? `${issue.path.join(".")}: ${issue.message}` : issue.message)).join("; ");

const describeError = (error: unknown): ErrorReport => {
	if (error instanceof ZodError) {
		return { status: 400, message: formatZodIssues(error), service: "validation", method: "unknownMethod", details: { issues: error.issues } };
	}
	if (error instanceof MulterError) {
		return { status: error.code === "LIMIT_FILE_SIZE" ? 413 : 400, message: error.message, service: "uploadMiddleware", method: "unknownMethod" };
	}
	if (error instanceof AppError) {
		return { status: error.status, message: error.message, service: error.service, method: error.method, details: error.details };
	}
	return { status: 500, message: error instanceof Error ? error.message : "Server error", service: "unknownService", method: "unknownMethod" };
};

const handleErrors = (logger: ILogger) => (error: unknown, req: Request, res: Response, _next: NextFunction) => {
	const report = describeError(error);
	const log = report.status < 500 ? logger.warn : logger.error;
	log({ ...report, stack: error instanceof Error ? error.stack : undefined });
	res.status(report.status).json({ status: report.status, msg: report.message });
};

export { handleErrors };
