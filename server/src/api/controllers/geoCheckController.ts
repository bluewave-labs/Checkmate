import { RequestHandler } from "express";
import { getChecksParamValidation, getChecksQueryValidation } from "@/api/validation/checkValidation.js";
import type { IGeoChecksService } from "@/domain/geo-checks/geo-check.service.js";
import { Handler, requireTeamId } from "./controllerUtils.js";

export interface IGeoCheckController {
	getGeoChecksByMonitor: RequestHandler;
}
class GeoCheckController implements IGeoCheckController {
	private geoChecksService: IGeoChecksService;
	constructor(geoChecksService: IGeoChecksService) {
		this.geoChecksService = geoChecksService;
	}

	getGeoChecksByMonitor: Handler = async (req, res) => {
		const validatedParams = getChecksParamValidation.parse(req.params);
		const validatedQuery = getChecksQueryValidation.parse(req.query);

		const teamId = requireTeamId(req.user?.teamId);

		const data = await this.geoChecksService.getGeoChecksByMonitor({
			monitorId: validatedParams.monitorId,
			teamId: teamId,
			sortOrder: validatedQuery.sortOrder,
			dateRange: validatedQuery.dateRange,
			page: validatedQuery.page,
			rowsPerPage: validatedQuery.rowsPerPage,
			continent: validatedQuery.continent,
		});

		res.json({ success: true, msg: "Geo checks retrieved successfully", data });
	};
}

export default GeoCheckController;
