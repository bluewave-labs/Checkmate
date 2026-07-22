import { Request, Response, RequestHandler } from "express";
import { catchAsync } from "@/utils/catchAsync.js";

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
	createStatusPage: RequestHandler;
	updateStatusPage: RequestHandler;
	getStatusPageByUrl: RequestHandler;
	resolveStatusPageByDomain: RequestHandler;
	getStatusPagesByTeamId: RequestHandler;
	deleteStatusPage: RequestHandler;
}

class StatusPageController implements IStatusPageController {
	static SERVICE_NAME = SERVICE_NAME;
	private statusPageService: IStatusPageService;
	constructor(statusPageService: IStatusPageService) {
		this.statusPageService = statusPageService;
	}

	createStatusPage = catchAsync(async (req: Request, res: Response) => {
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
	});

	updateStatusPage = catchAsync(async (req: Request, res: Response) => {
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
	});

	getStatusPageByUrl = catchAsync(async (req: Request, res: Response) => {
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
	});

	resolveStatusPageByDomain = catchAsync(async (req: Request, res: Response) => {
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
	});

	getStatusPagesByTeamId = catchAsync(async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const statusPages = await this.statusPageService.getStatusPagesByTeamId(teamId);

		return res.status(200).json({
			success: true,
			msg: "Status pages retrieved successfully",
			data: statusPages,
		});
	});

	deleteStatusPage = catchAsync(async (req: Request, res: Response) => {
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
	});
}

export default StatusPageController;
