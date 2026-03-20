import { Request, Response, NextFunction } from "express";
import { getChecksParamValidation, getChecksQueryValidation } from "@/validation/checkValidation.js";
import type { IGeoChecksService } from "@/service/business/geoChecksService.js";
import { requireTeamId } from "./controllerUtils.js";
import { AppError } from "@/utils/AppError.js";

const SERVICE_NAME = "geoCheckController";

export interface IGeoCheckController {
	getGeoChecksByMonitor: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
}
class GeoCheckController implements IGeoCheckController {
	static SERVICE_NAME = SERVICE_NAME;

	private geoChecksService: IGeoChecksService;
	constructor(geoChecksService: IGeoChecksService) {
		this.geoChecksService = geoChecksService;
	}

	get serviceName() {
		return GeoCheckController.SERVICE_NAME;
	}

	getGeoChecksByMonitor = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const validatedParams = getChecksParamValidation.parse(req.params);
			const validatedQuery = getChecksQueryValidation.parse(req.query);

			if (!validatedQuery.continent || validatedQuery.continent.length === 0) {
				throw new AppError({
					message: "At least one continent must be specified",
					service: SERVICE_NAME,
					method: "getGeoChecksByMonitor",
					details: { monitorId: validatedParams.monitorId },
					status: 400,
				});
			}

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
		} catch (error) {
			next(error);
		}
	};
}

export default GeoCheckController;
