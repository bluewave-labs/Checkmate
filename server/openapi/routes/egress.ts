import { registry } from "../registry.js";
import { bearer, okJson, standardErrors } from "../helpers.js";
import { egressStateResponseSchema } from "@/api/validation/egressValidation.js";

const tags = ["egress"];

registry.registerPath({
	method: "get",
	path: "/egress",
	tags,
	summary: "Get the instance's current egress self-check state",
	security: bearer,
	responses: { "200": okJson(egressStateResponseSchema), ...standardErrors },
});
