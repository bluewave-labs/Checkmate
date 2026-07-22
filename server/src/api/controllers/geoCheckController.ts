import { Request, Response, RequestHandler } from "express";
import { catchAsync } from "@/utils/catchAsync.js";
import { getChecksParamValidation, getChecksQueryValidation } from "@/api/validation/checkValidation.js";
import type { IGeoChecksService } from "@/domain/geo-checks/geo-check.service.js";
import { requireTeamId } from "./controllerUtils.js";

export interface IGeoCheckController {
	getGeoChecksByMonitor: RequestHandler;
}
class GeoCheckController implements IGeoCheckController {
	private geoChecksService: IGeoChecksService;
	constructor(geoChecksService: IGeoChecksService) {
		this.geoChecksService = geoChecksService;
	}

	getGeoChecksByMonitor = catchAsync(async (req: Request, res: Response) => {
		const validatedParams = getChecksParamValidation.parse(req.params);
		const validatedQuery = getChecksQueryValidation.parse(req.query);

		const teamId = requireTeamId(req.user?.teamId);

		const result = await this.geoChecksService.getGeoChecksByMonitor({
			monitorId: validatedParams.monitorId,
			teamId: teamId,
			sortOrder: validatedQuery.sortOrder,
			dateRange: validatedQuery.dateRange,
			page: validatedQuery.page,
			rowsPerPage: validatedQuery.rowsPerPage,
			continent: validatedQuery.continent,
		});

		return res.status(200).json({
			success: true,
			msg: "Geo checks retrieved successfully",
			data: result,
		});
	});
}

export default GeoCheckController;
