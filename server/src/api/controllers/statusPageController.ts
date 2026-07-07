import { Request, Response, NextFunction } from "express";

import {
	createStatusPageBodyValidation,
	getStatusPageParamValidation,
	getStatusPageQueryValidation,
	imageValidation,
	resolveStatusPageQueryValidation,
} from "@/api/validation/statusPageValidation.js";
import { AppError } from "@/utils/AppError.js";
import { requireTeamId, requireUserId } from "@/api/controllers/controllerUtils.js";
import { IStatusPageService } from "@/domain/status-pages/status-page.service.js";
import { resolveStatusPageDomainFromRequest } from "@/utils/statusPageDomain.js";

const SERVICE_NAME = "statusPageController";

export interface IStatusPageController {
	readonly serviceName: string;
	createStatusPage(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	updateStatusPage(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	getStatusPageByUrl(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	resolveStatusPageByDomain(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	getStatusPagesByTeamId(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	deleteStatusPage(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
}

class StatusPageController implements IStatusPageController {
	static SERVICE_NAME = SERVICE_NAME;
	private statusPageService: IStatusPageService;
	constructor(statusPageService: IStatusPageService) {
		this.statusPageService = statusPageService;
	}

	get serviceName() {
		return StatusPageController.SERVICE_NAME;
	}

	createStatusPage = async (req: Request, res: Response, next: NextFunction) => {
		try {
			createStatusPageBodyValidation.parse(req.body);
			if (req.file) {
				imageValidation.parse(req.file);
			}

			const teamId = requireTeamId(req?.user?.teamId);
			const userId = requireUserId(req?.user?.id);
			const statusPage = await this.statusPageService.createStatusPage(userId, teamId, req.file, req.body);

			return res.status(200).json({
				success: true,
				msg: "Status page created successfully",
				data: statusPage,
			});
		} catch (error) {
			next(error);
		}
	};

	updateStatusPage = async (req: Request, res: Response, next: NextFunction) => {
		try {
			createStatusPageBodyValidation.parse(req.body);
			if (req.file) {
				imageValidation.parse(req.file);
			}

			const teamId = requireTeamId(req?.user?.teamId);
			const statusPageId = req.params.id as string;
			if (!statusPageId) {
				throw new AppError({ message: "Status page ID is required", status: 400 });
			}
			const statusPage = await this.statusPageService.updateStatusPage(statusPageId, teamId, req.file, req.body);
			if (statusPage === null) {
				throw new AppError({ message: "Status page not found", status: 404 });
			}
			res.status(200).json({
				success: true,
				msg: "Status page updated successfully",
				data: statusPage,
			});
		} catch (error) {
			next(error);
		}
	};

	getStatusPageByUrl = async (req: Request, res: Response, next: NextFunction) => {
		try {
			getStatusPageParamValidation.parse(req.params);
			getStatusPageQueryValidation.parse(req.query);

			if (!req.params.url) {
				throw new AppError({ message: "Status page URL is required", status: 400 });
			}

			const statusPage = await this.statusPageService.getStatusPageByUrl(req.params.url as string);
			const data = await this.statusPageService.getPublicStatusPagePayload(statusPage, req.user?.teamId);

			return res.status(200).json({
				success: true,
				msg: "Status page retrieved successfully",
				data,
			});
		} catch (error) {
			next(error);
		}
	};

	resolveStatusPageByDomain = async (req: Request, res: Response, next: NextFunction) => {
		try {
			resolveStatusPageQueryValidation.parse(req.query);

			const domain = resolveStatusPageDomainFromRequest(req.hostname, req.query.domain as string | undefined);
			if (!domain) {
				throw new AppError({ message: "Domain is required", status: 400 });
			}

			const statusPage = await this.statusPageService.getStatusPageByCustomDomain(domain);
			if (!statusPage.isPublished) {
				throw new AppError({ message: "Status page not found", status: 404 });
			}

			const data = await this.statusPageService.getPublicStatusPagePayload(statusPage, req.user?.teamId);

			return res.status(200).json({
				success: true,
				msg: "Status page retrieved successfully",
				data,
			});
		} catch (error) {
			next(error);
		}
	};

	getStatusPagesByTeamId = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const teamId = requireTeamId(req.user?.teamId);
			const statusPages = await this.statusPageService.getStatusPagesByTeamId(teamId);

			return res.status(200).json({
				success: true,
				msg: "Status pages retrieved successfully",
				data: statusPages,
			});
		} catch (error) {
			next(error);
		}
	};

	deleteStatusPage = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const statusPageId = req.params.id as string;
			if (!statusPageId) {
				throw new AppError({ message: "Status page ID is required", status: 400 });
			}
			const teamId = requireTeamId(req.user?.teamId);
			await this.statusPageService.deleteStatusPage(statusPageId, teamId);
			return res.status(200).json({
				success: true,
				msg: "Status page deleted successfully",
			});
		} catch (error) {
			next(error);
		}
	};
}

export default StatusPageController;
