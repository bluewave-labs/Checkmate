import { registry } from "../registry.js";
import { bearer, multipart, okJsonNoData, okUnknown, standardErrors } from "../helpers.js";
import {
	createStatusPageBodyValidation,
	updateStatusPageBodyShape,
	unlockBodyValidation,
	getStatusPageParamValidation,
	getStatusPageQueryValidation,
} from "@/validation/statusPageValidation.js";

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
	request: {
		body: { content: multipart(updateStatusPageBodyShape, "logo") },
	},
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/status-page/{url}",
	tags,
	summary: "Get a public status page by its URL slug",
	request: { params: getStatusPageParamValidation, query: getStatusPageQueryValidation },
	responses: {
		"200": okUnknown,
		"401": { description: "Password required for protected page" },
		"404": { description: "Status page not found" },
		"500": standardErrors["500"],
	},
});

registry.registerPath({
	method: "post",
	path: "/status-page/{url}/unlock",
	tags,
	summary: "Unlock a password-protected status page; sets the unlock cookie on success",
	request: {
		params: getStatusPageParamValidation,
		body: { content: { "application/json": { schema: unlockBodyValidation } } },
	},
	responses: {
		"204": { description: "Unlock succeeded; cookie set" },
		"401": { description: "Incorrect password" },
		"429": { description: "Too many failed attempts" },
	},
});

registry.registerPath({
	method: "post",
	path: "/status-page/{url}/lock",
	tags,
	summary: "Clear the unlock cookie for a status page",
	request: { params: getStatusPageParamValidation },
	responses: { "204": { description: "Cookie cleared" } },
});

registry.registerPath({
	method: "delete",
	path: "/status-page/{id}",
	tags,
	summary: "Delete a status page",
	security: bearer,
	responses: { "200": okJsonNoData(), ...standardErrors },
});
