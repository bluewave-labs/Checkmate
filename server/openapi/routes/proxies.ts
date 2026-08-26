import { z } from "zod";
import { registry } from "../registry.js";
import { bearer, json, okJson, errorEnvelope, standardErrors } from "../helpers.js";
import {
	createProxyBodyValidation,
	editProxyBodyValidation,
	getProxyByIdParamValidation,
	editProxyParamValidation,
	deleteProxyParamValidation,
	proxyResponseSchema,
} from "@/api/validation/proxyValidation.js";

const tags = ["proxies"];

registry.registerPath({
	method: "post",
	path: "/proxies",
	tags,
	summary: "Create a proxy for the caller's team",
	security: bearer,
	request: { body: { content: json(createProxyBodyValidation) } },
	responses: { "200": okJson(proxyResponseSchema), ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/proxies",
	tags,
	summary: "List all proxies on the instance (admin/superadmin)",
	security: bearer,
	responses: { "200": okJson(z.array(proxyResponseSchema)), ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/proxies/team",
	tags,
	summary: "List proxies for the caller's team",
	security: bearer,
	responses: { "200": okJson(z.array(proxyResponseSchema)), ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/proxies/{id}",
	tags,
	summary: "Get a proxy by id",
	security: bearer,
	request: { params: getProxyByIdParamValidation },
	responses: { "200": okJson(proxyResponseSchema), ...standardErrors },
});

registry.registerPath({
	method: "patch",
	path: "/proxies/{id}",
	tags,
	summary: "Edit a proxy",
	security: bearer,
	request: { params: editProxyParamValidation, body: { content: json(editProxyBodyValidation) } },
	responses: { "200": okJson(proxyResponseSchema), ...standardErrors },
});

registry.registerPath({
	method: "delete",
	path: "/proxies/{id}",
	tags,
	summary: "Delete a proxy",
	security: bearer,
	request: { params: deleteProxyParamValidation },
	responses: {
		"200": okJson(proxyResponseSchema),
		"409": { description: "Proxy is in use by monitors or set as the global proxy", content: json(errorEnvelope) },
		...standardErrors,
	},
});
