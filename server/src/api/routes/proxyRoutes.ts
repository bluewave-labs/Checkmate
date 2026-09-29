import { IProxiesController } from "@/api/controllers/proxyController.js";
import { RouteTable } from "@/api/routes/defineRoutes.js";
import { errorJson, unknownResponseSchema } from "@/api/routes/openapiHelpers.js";
import {
	createProxyBodyValidation,
	deleteProxyParamValidation,
	editProxyBodyValidation,
	editProxyParamValidation,
	getProxyByIdParamValidation,
	proxyResponseSchema,
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
			response: proxyResponseSchema,
		},
		{
			method: "get",
			path: "/",
			handler: "getAllProxies",
			summary: "List all proxies on the instance (admin/superadmin)",
			roles: ["admin", "superadmin"],
			response: unknownResponseSchema,
		},
		{
			method: "get",
			path: "/team",
			handler: "getProxiesByTeamId",
			summary: "List proxies for the caller's team",
			response: unknownResponseSchema,
		},
		{
			method: "get",
			path: "/:id",
			handler: "getProxyById",
			summary: "Get a proxy by id",
			params: getProxyByIdParamValidation,
			response: proxyResponseSchema,
		},
		{
			method: "delete",
			path: "/:id",
			handler: "deleteProxy",
			summary: "Delete a proxy by id",
			params: deleteProxyParamValidation,
			response: proxyResponseSchema,
			spec: (d) => ({ ...d, responses: { ...d.responses, "409": errorJson("Proxy is in use by monitors or set as the global proxy") } }),
		},
		{
			method: "patch",
			path: "/:id",
			handler: "editProxy",
			summary: "Edit a proxy by id",
			params: editProxyParamValidation,
			body: editProxyBodyValidation,
			response: proxyResponseSchema,
		},
	],
};
