import { z } from "zod";
import { registry } from "../registry.js";
import { bearer, okJson, okJsonNoData, okUnknown, standardErrors } from "../helpers.js";
import {
	getChecksParamValidation,
	getChecksQueryValidation,
	getTeamChecksQueryValidation,
	deleteChecksParamValidation,
	getChecksSummaryByTeamIdQueryValidation,
} from "@/validation/checkValidation.js";

const tags = ["checks"];

registry.registerPath({
	method: "get",
	path: "/checks/team/summary",
	tags,
	summary: "Aggregate check summary for the caller's team",
	security: bearer,
	request: { query: getChecksSummaryByTeamIdQueryValidation },
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/checks/team",
	tags,
	summary: "List checks across the team",
	security: bearer,
	request: { query: getTeamChecksQueryValidation },
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "delete",
	path: "/checks/team",
	tags,
	summary: "Delete all checks for the team (admin/superadmin)",
	security: bearer,
	responses: { "200": okJson(z.object({ deletedCount: z.number() })), ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/checks/{monitorId}",
	tags,
	summary: "List checks for a monitor",
	security: bearer,
	request: { params: getChecksParamValidation, query: getChecksQueryValidation },
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "delete",
	path: "/checks/{monitorId}",
	tags,
	summary: "Delete checks for a monitor",
	security: bearer,
	request: { params: deleteChecksParamValidation },
	responses: { "200": okJsonNoData(), ...standardErrors },
});
