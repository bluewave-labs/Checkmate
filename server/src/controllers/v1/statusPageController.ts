import { Request, Response, NextFunction } from "express";

import { createStatusPageBodyValidation, getStatusPageParamValidation, getStatusPageQueryValidation, imageValidation } from "@/validation/joi.js";
import { AppError } from "@/utils/AppError.js";

const SERVICE_NAME = "statusPageController";

class StatusPageController {
	static SERVICE_NAME = SERVICE_NAME;
	private db: any;
	constructor(db: any) {
		this.db = db;
	}

	get serviceName() {
		return StatusPageController.SERVICE_NAME;
	}

	createStatusPage = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await createStatusPageBodyValidation.validateAsync(req.body);
			await imageValidation.validateAsync(req.file);

			const { _id, teamId } = req.user;
			const statusPage = await this.db.statusPageModule.createStatusPage({
				statusPageData: req.body,
				image: req.file,
				userId: _id,
				teamId,
			});
			return res.status(200).json({
				msg: "Status page created successfully",
				data: statusPage,
			});
		} catch (error) {
			next(error);
		}
	};

	updateStatusPage = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await createStatusPageBodyValidation.validateAsync(req.body);
			await imageValidation.validateAsync(req.file);

			const statusPage = await this.db.statusPageModule.updateStatusPage(req.body, req.file);
			if (statusPage === null) {
				throw new AppError({ message: "Status page not found", status: 404 });
			}
			return res.status(200).json({
				msg: "Status page updated successfully",
				data: statusPage,
			});
		} catch (error) {
			next(error);
		}
	};

	getStatusPage = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const statusPage = await this.db.statusPageModule.getStatusPage();
			return res.status(200).json({
				msg: "Status page retrieved successfully",
				data: statusPage,
			});
		} catch (error) {
			next(error);
		}
	};

	getStatusPageByUrl = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await getStatusPageParamValidation.validateAsync(req.params);
			await getStatusPageQueryValidation.validateAsync(req.query);

			const statusPage = await this.db.statusPageModule.getStatusPageByUrl(req.params.url);
			return res.status(200).json({
				msg: "Status page retrieved successfully",
				data: statusPage,
			});
		} catch (error) {
			next(error);
		}
	};
	getStatusPagesByTeamId = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const teamId = req.user.teamId;
			const statusPages = await this.db.statusPageModule.getStatusPagesByTeamId(teamId);

			return res.status(200).json({
				msg: "Status pages retrieved successfully",
				data: statusPages,
			});
		} catch (error) {
			next(error);
		}
	};
	deleteStatusPage = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await this.db.statusPageModule.deleteStatusPage(req.params.url);
			return res.status(200).json({
				msg: "Status page deleted successfully",
			});
		} catch (error) {
			next(error);
		}
	};
}

export default StatusPageController;
