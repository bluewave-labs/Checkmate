import { NextFunction, Request, RequestHandler, Response } from "express";
import { IStatusPagesRepository } from "@/repositories/index.js";
import { AppError } from "@/utils/AppError.js";

export const createVerifyStatusPageAccess = (statusPagesRepository: IStatusPagesRepository, verifyJWT: RequestHandler) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			const url = Array.isArray(req.params.url) ? req.params.url[0] : req.params.url;
			if (!url) {
				throw new AppError({ message: "Status page URL is required", status: 400 });
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
