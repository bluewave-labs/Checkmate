import { NextFunction, Request, RequestHandler, Response } from "express";
import { IStatusPagesRepository } from "@/domain/status-pages/status-page-repository.interface.js";
import { AppError } from "@/utils/AppError.js";
import { middlewareErrors } from "@/api/middleware/middleware.errors.js";
const SERVICE_NAME = "VerifyStatusPageAccess";
export const createVerifyStatusPageAccess = (statusPagesRepository: IStatusPagesRepository, verifyJWT: RequestHandler) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			const url = Array.isArray(req.params.url) ? req.params.url[0] : req.params.url;
			if (!url) {
				throw new AppError(middlewareErrors.invalidRequest, { service: SERVICE_NAME, method: "createVerifyStatusPageAccess" });
			}
			const statusPage = await statusPagesRepository.findByUrl(url);
			if (statusPage.isPublished) {
				next(); // Published — no auth needed
			} else {
				verifyJWT(req, res, next); // Unpublished — require JWT
			}
		} catch (error) {
			next(error);
		}
	};
};
