import { Request, Response, NextFunction } from "express";

import {
	getChecksParamValidation,
	getChecksQueryValidation,
	getTeamChecksQueryValidation,
	getChecksSummaryByTeamIdQueryValidation,
	deleteChecksParamValidation,
} from "@/validation/checkValidation.js";
import { ICheckService } from "@/service/index.js";
import { requireTeamId } from "@/controllers/controllerUtils.js";

const SERVICE_NAME = "checkController";

class CheckController {
	static SERVICE_NAME = SERVICE_NAME;

	private checkService: ICheckService;
	constructor(checkService: ICheckService) {
		this.checkService = checkService;
	}

	get serviceName() {
		return CheckController.SERVICE_NAME;
	}

	getChecksByMonitor = async (req: Request, res: Response, next: NextFunction) => {
		try {
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
		} catch (error) {
			next(error);
		}
	};

	getChecksByTeam = async (req: Request, res: Response, next: NextFunction) => {
		try {
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
		} catch (error) {
			next(error);
		}
	};

	getChecksSummaryByTeamId = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const validatedQuery = getChecksSummaryByTeamIdQueryValidation.parse(req.query);
			const teamId = requireTeamId(req.user?.teamId);
			const dateRange = validatedQuery.dateRange ?? "hour";

			const summary = await this.checkService.getChecksSummaryByTeamId({ teamId, dateRange });
			return res.status(200).json({
				success: true,
				msg: "Checks summary retrieved successfully",
				data: summary,
			});
		} catch (error) {
			next(error);
		}
	};

	deleteChecks = async (req: Request, res: Response, next: NextFunction) => {
		try {
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
		} catch (error) {
			next(error);
		}
	};

	deleteChecksByTeamId = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const teamId = requireTeamId(req.user?.teamId);

			const deletedCount = await this.checkService.deleteChecksByTeamId({ teamId });

			return res.status(200).json({
				success: true,
				msg: "Checks deleted successfully",
				data: { deletedCount },
			});
		} catch (error) {
			next(error);
		}
	};
}

export default CheckController;
