import type { ZodObject } from "zod";
import type { OpenAPIRegistry, RouteConfig } from "@asteasolutions/zod-to-openapi";
import type { Auth, RouteDef, RouteTable } from "@/api/routes/defineRoutes.js";
import { bearer, errorJson, json, multipart, okJson, okJsonNoData } from "@/api/routes/openapiHelpers.js";

const guardErrors = <C>(r: RouteDef<C>, auth: Auth): Record<string, string> => {
	const errors: Record<string, string> = {};
	if (r.params || r.query || r.body) errors["400"] = "Invalid request";
	if (auth === "statusPage") {
		errors["400"] = "Invalid request";
		errors["404"] = "Status page not found";
	}
	if (auth !== "none") errors["401"] = "Unauthorized";
	if (r.roles) errors["403"] = "Forbidden";
	if (r.upload) {
		errors["400"] = "Invalid request";
		errors["413"] = "File too large";
		errors["415"] = "Unsupported file type";
	}
	errors["429"] = "Too many requests";
	errors["500"] = "Internal server error";
	return errors;
};

const errorResponses = (descriptions: Record<string, string>): RouteConfig["responses"] =>
	Object.fromEntries(
		Object.entries(descriptions)
			.sort(([a], [b]) => Number(a) - Number(b))
			.map(([status, description]) => [status, errorJson(description)])
	);
// Returns:
// {
// 	"400": { description: "Invalid request", content: { "application/json": { schema: errorEnvelope } } },
// 	"401": { description: "Unauthorized", content: { "application/json": { schema: errorEnvelope } } },
// 	"429": { description: "Too many requests", content: { "application/json": { schema: errorEnvelope } } },
// 	"500": { description: "Internal server error", content: { "application/json": { schema: errorEnvelope } } },
// }

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
				...errorResponses({ ...guardErrors(r, auth), ...r.errors }),
			},
		};
		registry.registerPath(r.spec ? r.spec(derived) : derived);
	}
};
