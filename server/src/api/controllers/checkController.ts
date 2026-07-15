import { Request, Response, RequestHandler } from "express";
import { catchAsync } from "@/utils/catchAsync.js";

import {
	getChecksParamValidation,
	getChecksQueryValidation,
	getTeamChecksQueryValidation,
	getChecksSummaryByTeamIdQueryValidation,
	deleteChecksParamValidation,
} from "@/api/validation/checkValidation.js";
import { ICheckService } from "@/domain/checks/check.service.js";
import { requireTeamId } from "@/api/controllers/controllerUtils.js";

const SERVICE_NAME = "checkController";

export interface ICheckController {
	serviceName: string;
	getChecksByMonitor: RequestHandler;
	getChecksByTeam: RequestHandler;
	getChecksSummaryByTeamId: RequestHandler;
	deleteChecks: RequestHandler;
	deleteChecksByTeamId: RequestHandler;
}

class CheckController implements ICheckController {
	static SERVICE_NAME = SERVICE_NAME;

	private checkService: ICheckService;
	constructor(checkService: ICheckService) {
		this.checkService = checkService;
	}

	get serviceName() {
		return CheckController.SERVICE_NAME;
	}

	getChecksByMonitor = catchAsync(async (req: Request, res: Response) => {
		const validatedParams = getChecksParamValidation.parse(req.params);
		const validatedQuery = getChecksQueryValidation.parse(req.query);

		const teamId = requireTeamId(req.user?.teamId);

		const result = await this.checkService.getChecksByMonitor({
			monitorId: validatedParams.monitorId,
			teamId,
			sortOrder: validatedQuery.sortOrder,
			dateRange: validatedQuery.dateRange,
			filter: validatedQuery.filter,
			page: validatedQuery.page,
			rowsPerPage: validatedQuery.rowsPerPage,
			status: validatedQuery.status,
		});

		return res.status(200).json({
			success: true,
			msg: "Checks retrieved successfully",
			data: result,
		});
	});

	getChecksByTeam = catchAsync(async (req: Request, res: Response) => {
		const validatedQuery = getTeamChecksQueryValidation.parse(req.query);
		const teamId = requireTeamId(req.user?.teamId);

		const checkData = await this.checkService.getChecksByTeam({
			teamId,
			sortOrder: validatedQuery.sortOrder,
			dateRange: validatedQuery.dateRange,
			page: validatedQuery.page,
			rowsPerPage: validatedQuery.rowsPerPage,
			filter: validatedQuery.filter,
		});
		return res.status(200).json({
			success: true,
			msg: "Team checks retrieved successfully",
			data: checkData,
		});
	});

	getChecksSummaryByTeamId = catchAsync(async (req: Request, res: Response) => {
		const validatedQuery = getChecksSummaryByTeamIdQueryValidation.parse(req.query);
		const teamId = requireTeamId(req.user?.teamId);
		const dateRange = validatedQuery.dateRange ?? "hour";

		const summary = await this.checkService.getChecksSummaryByTeamId({ teamId, dateRange });
		return res.status(200).json({
			success: true,
			msg: "Checks summary retrieved successfully",
			data: summary,
		});
	});

	deleteChecks = catchAsync(async (req: Request, res: Response) => {
		const validatedParams = deleteChecksParamValidation.parse(req.params);
		const teamId = requireTeamId(req.user?.teamId);

		const deletedCount = await this.checkService.deleteChecks({
			monitorId: validatedParams.monitorId,
			teamId,
		});

		return res.status(200).json({
			success: true,
			msg: "Checks deleted successfully",
			data: { deletedCount },
		});
	});

	deleteChecksByTeamId = catchAsync(async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);

		const deletedCount = await this.checkService.deleteChecksByTeamId({ teamId });

		return res.status(200).json({
			success: true,
			msg: "Checks deleted successfully",
			data: { deletedCount },
		});
	});
}

export default CheckController;
