import { registry } from "../registry.js";
import { bearer, okUnknown, standardErrors } from "../helpers.js";

registry.registerPath({
	method: "get",
	path: "/logs",
	tags: ["logs"],
	summary: "Get application logs (admin/superadmin)",
	security: bearer,
	responses: { "200": okUnknown, ...standardErrors },
});
