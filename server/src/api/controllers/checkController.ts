import { Request, Response, RequestHandler } from "express";

import {
	getChecksParamValidation,
	getChecksQueryValidation,
	getTeamChecksQueryValidation,
	getChecksSummaryByTeamIdQueryValidation,
	deleteChecksParamValidation,
} from "@/api/validation/checkValidation.js";
import { ICheckService } from "@/domain/checks/check.service.js";
import { requireTeamId } from "@/api/controllers/controllerUtils.js";

export interface ICheckController {
	getChecksByMonitor: RequestHandler;
	getChecksByTeam: RequestHandler;
	getChecksSummaryByTeamId: RequestHandler;
	deleteChecks: RequestHandler;
	deleteChecksByTeamId: RequestHandler;
}

class CheckController implements ICheckController {
	private checkService: ICheckService;
	constructor(checkService: ICheckService) {
		this.checkService = checkService;
	}

	getChecksByMonitor = async (req: Request, res: Response) => {
		const validatedParams = getChecksParamValidation.parse(req.params);
		const validatedQuery = getChecksQueryValidation.parse(req.query);

		const teamId = requireTeamId(req.user?.teamId);

		const data = await this.checkService.getChecksByMonitor({
			monitorId: validatedParams.monitorId,
			teamId,
			sortOrder: validatedQuery.sortOrder,
			dateRange: validatedQuery.dateRange,
			filter: validatedQuery.filter,
			page: validatedQuery.page,
			rowsPerPage: validatedQuery.rowsPerPage,
			status: validatedQuery.status,
		});

		res.json({ success: true, msg: "Checks retrieved successfully", data });
	};

	getChecksByTeam = async (req: Request, res: Response) => {
		const validatedQuery = getTeamChecksQueryValidation.parse(req.query);
		const teamId = requireTeamId(req.user?.teamId);

		const data = await this.checkService.getChecksByTeam({
			teamId,
			sortOrder: validatedQuery.sortOrder,
			dateRange: validatedQuery.dateRange,
			page: validatedQuery.page,
			rowsPerPage: validatedQuery.rowsPerPage,
			filter: validatedQuery.filter,
		});
		res.json({ success: true, msg: "Team checks retrieved successfully", data });
	};

	getChecksSummaryByTeamId = async (req: Request, res: Response) => {
		const validatedQuery = getChecksSummaryByTeamIdQueryValidation.parse(req.query);
		const teamId = requireTeamId(req.user?.teamId);
		const dateRange = validatedQuery.dateRange ?? "hour";

		const data = await this.checkService.getChecksSummaryByTeamId({ teamId, dateRange });
		res.json({ success: true, msg: "Checks summary retrieved successfully", data });
	};

	deleteChecks = async (req: Request, res: Response) => {
		const validatedParams = deleteChecksParamValidation.parse(req.params);
		const teamId = requireTeamId(req.user?.teamId);

		const deletedCount = await this.checkService.deleteChecks({
			monitorId: validatedParams.monitorId,
			teamId,
		});

		res.json({ success: true, msg: "Checks deleted successfully", data: { deletedCount } });
	};

	deleteChecksByTeamId = async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);

		const deletedCount = await this.checkService.deleteChecksByTeamId({ teamId });

		res.json({ success: true, msg: "Checks deleted successfully", data: { deletedCount } });
	};
}

export default CheckController;
