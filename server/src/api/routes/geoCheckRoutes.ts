import { IGeoCheckController } from "@/api/controllers/geoCheckController.js";
import { RouteTable } from "@/api/routes/defineRoutes.js";
import { getChecksParamValidation, getChecksQueryValidation } from "@/api/validation/checkValidation.js";
import { flatGeoChecksQueryResultSchema } from "@/domain/geo-checks/geo-check.schema.js";
import { monitorErrors } from "@/domain/monitors/monitor.errors.js";

export const geoCheckRoutes: RouteTable<IGeoCheckController> = {
	prefix: "/geo-checks",
	tag: "geo-checks",
	auth: "jwt",
	routes: [
		{
			method: "get",
			path: "/:monitorId",
			handler: "getGeoChecksByMonitor",
			summary: "Get geo check results for a monitor",
			errors: [monitorErrors.notFound],
			params: getChecksParamValidation,
			query: getChecksQueryValidation,
			response: flatGeoChecksQueryResultSchema,
		},
	],
};
