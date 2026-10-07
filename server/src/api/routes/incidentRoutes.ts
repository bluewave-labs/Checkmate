import { IIncidentController } from "@/api/controllers/incidentController.js";
import { RouteTable } from "@/api/routes/defineRoutes.js";
import {
	getIncidentsByTeamQueryValidation,
	getIncidentSummaryQueryValidation,
	incidentIdParamValidation,
	resolveIncidentBodyValidation,
	incidentListResponseSchema,
	incidentDetailResponseSchema,
} from "@/api/validation/incidentValidation.js";

import { incidentSchema, incidentSummarySchema } from "@/domain/incidents/incident.schema.js";
import { incidentErrors } from "@/domain/incidents/incident.errors.js";
import { monitorErrors } from "@/domain/monitors/monitor.errors.js";
import { userErrors } from "@/domain/users/user.errors.js";

export const incidentRoutes: RouteTable<IIncidentController> = {
	prefix: "/incidents",
	tag: "incidents",
	auth: "jwt",
	routes: [
		{
			method: "get",
			path: "/team",
			handler: "getIncidentsByTeam",
			summary: "List incidents for the caller's team",
			query: getIncidentsByTeamQueryValidation,
			response: incidentListResponseSchema,
		},
		{
			method: "get",
			path: "/team/summary",
			handler: "getIncidentSummary",
			summary: "Incident summary for the caller's team",
			query: getIncidentSummaryQueryValidation,
			response: incidentSummarySchema,
		},
		{
			method: "get",
			path: "/:incidentId",
			handler: "getIncidentById",
			summary: "Get an incident by id",
			errors: [incidentErrors.notFound, monitorErrors.notFound, userErrors.notFound],
			params: incidentIdParamValidation,
			response: incidentDetailResponseSchema,
		},
		{
			method: "put",
			path: "/:incidentId/resolve",
			handler: "resolveIncidentManually",
			summary: "Manually resolve an incident (admin/superadmin)",
			roles: ["admin", "superadmin"],
			errors: [incidentErrors.notFound, incidentErrors.alreadyResolved],
			params: incidentIdParamValidation,
			body: resolveIncidentBodyValidation,
			response: incidentSchema,
		},
	],
};
