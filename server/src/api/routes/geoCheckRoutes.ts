import { IGeoCheckController } from "@/api/controllers/geoCheckController.js";
import { RouteTable } from "@/api/routes/defineRoutes.js";
import { flatGeoChecksResponseSchema, getChecksParamValidation, getChecksQueryValidation } from "@/api/validation/checkValidation.js";

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
			params: getChecksParamValidation,
			query: getChecksQueryValidation,
			response: flatGeoChecksResponseSchema,
		},
	],
};
