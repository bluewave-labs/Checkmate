import type { ZodObject } from "zod";
import type { OpenAPIRegistry, RouteConfig } from "@asteasolutions/zod-to-openapi";
import type { RouteTable } from "@/api/routes/defineRoutes.js";
import { bearer, json, multipart, okJson, okJsonNoData, standardErrors } from "@/api/routes/openapiHelpers.js";

export const registerRoutes = <C>(registry: OpenAPIRegistry, table: RouteTable<C>): void => {
	for (const r of table.routes) {
		const auth = r.auth ?? table.auth;
		const path = (`${table.prefix}${r.path}`.replace(/\/$/, "") || "/").replace(/:(\w+)/g, "{$1}");
		const request: RouteConfig["request"] = {
			...(r.params ? { params: r.params } : {}),
			...(r.query ? { query: r.query } : {}),
			...(r.body ? { body: { content: r.upload ? multipart((r.body as ZodObject).shape, r.upload) : json(r.body) } } : {}),
		};
		const derived: RouteConfig = {
			method: r.method,
			path,
			tags: [table.tag],
			summary: r.summary,
			...(auth === "jwt" ? { security: bearer } : {}),
			...(Object.keys(request).length > 0 ? { request } : {}),
			responses: {
				"200": r.response ? okJson(r.response) : okJsonNoData(),
				...(auth === "jwt" ? standardErrors : { "500": standardErrors["500"] }),
			},
		};
		registry.registerPath(r.spec ? r.spec(derived) : derived);
	}
};
