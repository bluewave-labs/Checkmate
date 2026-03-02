import { Request, Response, NextFunction } from "express";
import { getChecksParamValidation, getChecksQueryValidation } from "@/validation/checkValidation.js";
import type { IGeoChecksService } from "@/service/business/geoChecksService.js";

const SERVICE_NAME = "geoCheckController";

class GeoCheckController {
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
			getChecksParamValidation.parse(req.params);
			getChecksQueryValidation.parse(req.query);

			const result = await this.geoChecksService.getGeoChecksByMonitor({
				monitorId: req?.params?.monitorId as string,
				query: req?.query,
				teamId: req?.user?.teamId as string,
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
