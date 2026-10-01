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
			errors: { 404: "Incident, monitor or resolving user not found" },
			params: incidentIdParamValidation,
			response: incidentDetailResponseSchema,
		},
		{
			method: "put",
			path: "/:incidentId/resolve",
			handler: "resolveIncidentManually",
			summary: "Manually resolve an incident (admin/superadmin)",
			roles: ["admin", "superadmin"],
			errors: { 404: "Incident not found", 409: "Incident is already resolved" },
			params: incidentIdParamValidation,
			body: resolveIncidentBodyValidation,
			response: incidentSchema,
		},
	],
};
