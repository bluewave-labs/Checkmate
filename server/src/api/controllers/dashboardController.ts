import { Request, Response, RequestHandler } from "express";
import { catchAsync } from "@/utils/catchAsync.js";
import { requireTeamId } from "@/api/controllers/controllerUtils.js";
import type { IDashboardService } from "@/domain/dashboard/dashboard.service.js";

export interface IDashboardController {
	getSummary: RequestHandler;
}

class DashboardController implements IDashboardController {
	private dashboardService: IDashboardService;

	constructor(dashboardService: IDashboardService) {
		this.dashboardService = dashboardService;
	}

	getSummary = catchAsync(async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const data = await this.dashboardService.getSummary(teamId);
		return res.status(200).json({
			success: true,
			msg: "Dashboard summary retrieved successfully",
			data,
		});
	});
}

export default DashboardController;
