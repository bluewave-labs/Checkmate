import { registry } from "../registry.js";
import { bearer, multipart, okJsonNoData, okUnknown, standardErrors } from "../helpers.js";
import { createStatusPageBodyValidation, getStatusPageParamValidation, getStatusPageQueryValidation } from "@/validation/statusPageValidation.js";

const tags = ["status-page"];

registry.registerPath({
	method: "get",
	path: "/status-page/team",
	tags,
	summary: "List status pages for the caller's team",
	security: bearer,
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "post",
	path: "/status-page",
	tags,
	summary: "Create a status page (logo upload optional)",
	security: bearer,
	request: { body: { content: multipart(createStatusPageBodyValidation.shape, "logo") } },
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "put",
	path: "/status-page/{id}",
	tags,
	summary: "Update a status page (logo upload optional)",
	security: bearer,
	request: { body: { content: multipart(createStatusPageBodyValidation.shape, "logo") } },
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/status-page/{url}",
	tags,
	summary: "Get a public status page by its URL slug",
	request: { params: getStatusPageParamValidation, query: getStatusPageQueryValidation },
	responses: { "200": okUnknown, "404": { description: "Status page not found" }, "500": standardErrors["500"] },
});

registry.registerPath({
	method: "delete",
	path: "/status-page/{id}",
	tags,
	summary: "Delete a status page",
	security: bearer,
	responses: { "200": okJsonNoData(), ...standardErrors },
});
