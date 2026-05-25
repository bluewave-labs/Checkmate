import { registry } from "../registry.js";
import { bearer, okUnknown, standardErrors } from "../helpers.js";
import { getChecksParamValidation, getChecksQueryValidation } from "@/validation/checkValidation.js";

registry.registerPath({
	method: "get",
	path: "/geo-checks/{monitorId}",
	tags: ["geo-checks"],
	summary: "Get geo check results for a monitor",
	security: bearer,
	request: { params: getChecksParamValidation, query: getChecksQueryValidation },
	responses: { "200": okUnknown, ...standardErrors },
});
