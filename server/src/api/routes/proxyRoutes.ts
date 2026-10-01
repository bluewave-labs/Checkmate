import { IProxiesController } from "@/api/controllers/proxyController.js";
import { RouteTable } from "@/api/routes/defineRoutes.js";
import { proxyResponseSchema } from "@/domain/proxies/proxy.schema.js";
import {
	createProxyBodyValidation,
	deleteProxyParamValidation,
	editProxyBodyValidation,
	editProxyParamValidation,
	getProxyByIdParamValidation,
	proxyListResponseSchema,
} from "@/api/validation/proxyValidation.js";

export const proxyRoutes: RouteTable<IProxiesController> = {
	prefix: "/proxies",
	tag: "proxies",
	auth: "jwt",
	routes: [
		{
			method: "post",
			path: "/",
			handler: "createProxy",
			summary: "Create a proxy for the caller's team",
			body: createProxyBodyValidation,
			errors: { 409: "A proxy with that name already exists" },
			response: proxyResponseSchema,
		},
		{
			method: "get",
			path: "/",
			handler: "getAllProxies",
			summary: "List all proxies on the instance (admin/superadmin)",
			roles: ["admin", "superadmin"],
			response: proxyListResponseSchema,
		},
		{
			method: "get",
			path: "/team",
			handler: "getProxiesByTeamId",
			summary: "List proxies for the caller's team",
			response: proxyListResponseSchema,
		},
		{
			method: "get",
			path: "/:id",
			handler: "getProxyById",
			summary: "Get a proxy by id",
			params: getProxyByIdParamValidation,
			errors: { 404: "Proxy not found" },
			response: proxyResponseSchema,
		},
		{
			method: "delete",
			path: "/:id",
			handler: "deleteProxy",
			summary: "Delete a proxy by id",
			params: deleteProxyParamValidation,
			errors: { 404: "Proxy not found", 409: "Proxy is in use by monitors or set as the global proxy" },
		},
		{
			method: "patch",
			path: "/:id",
			handler: "editProxy",
			summary: "Edit a proxy by id",
			params: editProxyParamValidation,
			body: editProxyBodyValidation,
			errors: { 404: "Proxy not found", 409: "A proxy with that name already exists" },
			response: proxyResponseSchema,
		},
	],
};
