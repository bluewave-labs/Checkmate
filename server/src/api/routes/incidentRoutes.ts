import { Router } from "express";
import { isAllowed } from "../middleware/isAllowed.js";
import { IIncidentController } from "@/api/controllers/incidentController.js";
import { RouteTable } from "@/api/routes/defineRoutes.js";
import {
	getIncidentsByTeamQueryValidation,
	getIncidentSummaryQueryValidation,
	incidentIdParamValidation,
	resolveIncidentBodyValidation,
	incidentResponseSchema,
	incidentListResponseSchema,
	incidentSummaryResponseSchema,
	incidentDetailResponseSchema,
} from "@/api/validation/incidentValidation.js";

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
			response: incidentSummaryResponseSchema,
		},
		{
			method: "get",
			path: "/:incidentId",
			handler: "getIncidentById",
			summary: "Get an incident by id",
			params: incidentIdParamValidation,
			response: incidentDetailResponseSchema,
		},
		{
			method: "put",
			path: "/:incidentId/resolve",
			handler: "resolveIncidentManually",
			summary: "Manually resolve an incident (admin/superadmin)",
			roles: ["admin", "superadmin"],
			params: incidentIdParamValidation,
			body: resolveIncidentBodyValidation,
			response: incidentResponseSchema,
		},
	],
};
