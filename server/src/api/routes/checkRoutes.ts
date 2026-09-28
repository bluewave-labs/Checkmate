import { ICheckController } from "@/api/controllers/checkController.js";
import { RouteTable } from "@/api/routes/defineRoutes.js";
import {
	getChecksSummaryByTeamIdQueryValidation,
	getTeamChecksQueryValidation,
	deletedCountResponseSchema,
	getChecksParamValidation,
	getChecksQueryValidation,
	deleteChecksParamValidation,
} from "@/api/validation/checkValidation.js";
import { unknownResponseSchema } from "@/api/routes/openapiHelpers.js";

export const checkRoutes: RouteTable<ICheckController> = {
	prefix: "/checks",
	tag: "checks",
	auth: "jwt",
	routes: [
		{
			method: "get",
			path: "/team/summary",
			handler: "getChecksSummaryByTeamId",
			summary: "Aggregate check summary for the caller's team",
			query: getChecksSummaryByTeamIdQueryValidation,
			response: unknownResponseSchema,
		},
		{
			method: "get",
			path: "/team",
			handler: "getChecksByTeam",
			summary: "List checks across the team",
			query: getTeamChecksQueryValidation,
			response: unknownResponseSchema,
		},
		{
			method: "delete",
			path: "/team",
			handler: "deleteChecksByTeamId",
			summary: "Delete all checks for the team (admin/superadmin)",
			roles: ["admin", "superadmin"],
			response: deletedCountResponseSchema,
		},
		{
			method: "get",
			path: "/:monitorId",
			handler: "getChecksByMonitor",
			summary: "List checks for a monitor",
			params: getChecksParamValidation,
			query: getChecksQueryValidation,
			response: unknownResponseSchema,
		},
		{
			method: "delete",
			path: "/:monitorId",
			handler: "deleteChecks",
			summary: "Delete checks for a monitor",
			roles: ["admin", "superadmin"],
			params: deleteChecksParamValidation,
		},
	],
};
