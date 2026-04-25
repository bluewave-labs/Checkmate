import { z } from "zod";
import { registry } from "../registry.js";
import { bearer, okJsonNoData, okUnknown, standardErrors } from "../helpers.js";
import { getIncidentsByTeamQueryValidation, getIncidentSummaryQueryValidation } from "@/validation/incidentValidation.js";

const tags = ["incidents"];

const incidentIdParam = z.object({ incidentId: z.string() });

registry.registerPath({
	method: "get",
	path: "/incidents/team",
	tags,
	summary: "List incidents for the caller's team",
	security: bearer,
	request: { query: getIncidentsByTeamQueryValidation },
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/incidents/team/summary",
	tags,
	summary: "Incident summary for the caller's team",
	security: bearer,
	request: { query: getIncidentSummaryQueryValidation },
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/incidents/{incidentId}",
	tags,
	summary: "Get an incident by id",
	security: bearer,
	request: { params: incidentIdParam },
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "put",
	path: "/incidents/{incidentId}/resolve",
	tags,
	summary: "Manually resolve an incident (admin/superadmin)",
	security: bearer,
	request: { params: incidentIdParam },
	responses: { "200": okJsonNoData(), ...standardErrors },
});
