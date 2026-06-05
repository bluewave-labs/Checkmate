import { registry } from "../registry.js";
import { bearer, okUnknown, standardErrors } from "../helpers.js";

registry.registerPath({
	method: "get",
	path: "/diagnostic/system",
	tags: ["diagnostic"],
	summary: "Get system diagnostics (admin/superadmin)",
	security: bearer,
	responses: { "200": okUnknown, ...standardErrors },
});
