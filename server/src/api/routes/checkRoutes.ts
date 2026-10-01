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
import { checksPageSchema, checksSummarySchema } from "@/domain/checks/check.schema.js";

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
			response: checksSummarySchema,
		},
		{
			method: "get",
			path: "/team",
			handler: "getChecksByTeam",
			summary: "List checks across the team",
			query: getTeamChecksQueryValidation,
			response: checksPageSchema,
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
			errors: { 404: "Monitor not found" },
			params: getChecksParamValidation,
			query: getChecksQueryValidation,
			response: checksPageSchema,
		},
		{
			method: "delete",
			path: "/:monitorId",
			handler: "deleteChecks",
			summary: "Delete checks for a monitor (admin/superadmin)",
			errors: { 404: "Monitor not found" },
			roles: ["admin", "superadmin"],
			params: deleteChecksParamValidation,
			response: deletedCountResponseSchema,
		},
	],
};
