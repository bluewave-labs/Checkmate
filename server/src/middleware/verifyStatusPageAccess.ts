import { NextFunction, Request, Response } from "express";
import { IStatusPagesRepository } from "@/repositories/index.js";
import { AppError } from "@/utils/AppError.js";

export const createVerifyStatusPageAccess = (statusPagesRepository: IStatusPagesRepository) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			const url = req.params.url;
			if (!url) {
				throw new AppError({ message: "Status page URL is required", status: 400 });
			}
			const statusPage = await statusPagesRepository.findByUrl(url);
			if (statusPage.isPublished) {
				next(); // Published — proceed to controller (no JWT)
			} else {
				next("route"); // Unpublished — skip to next route (which has verifyJWT)
			}
		} catch (error) {
			next(error);
		}
	};
};
