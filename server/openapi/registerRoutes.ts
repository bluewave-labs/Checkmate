import type { ZodObject } from "zod";
import type { OpenAPIRegistry, RouteConfig } from "@asteasolutions/zod-to-openapi";
import type { Auth, RouteDef, RouteTable } from "@/api/routes/defineRoutes.js";
import { bearer, errorJson, json, multipart, okJson, okJsonNoData } from "@/api/routes/openapiHelpers.js";
import { middlewareErrors } from "@/api/middleware/middleware.errors.js";
import { statusPageErrors } from "@/domain/status-pages/status-page.errors.js";
import { internalError, type ErrorDefinition } from "@/utils/AppError.js";

/** The errors an entry's middleware can produce before its handler runs. */
export const guardErrors = <C>(r: RouteDef<C>, auth: Auth): ErrorDefinition[] => {
	const guards: ErrorDefinition[] = [];
	if (r.params || r.query || r.body || r.upload || auth === "statusPage") guards.push(middlewareErrors.invalidRequest);
	if (auth === "statusPage") guards.push(statusPageErrors.notFound);
	if (auth !== "none") guards.push(middlewareErrors.unauthenticated);
	if (r.roles) guards.push(middlewareErrors.forbidden);
	if (r.upload) guards.push(middlewareErrors.fileTooLarge, middlewareErrors.unsupportedFileType);
	guards.push(middlewareErrors.tooManyRequests, internalError);
	return guards;
};

const lowerFirst = (text: string): string => text.charAt(0).toLowerCase() + text.slice(1);

const describe = (descriptions: string[]): string => descriptions.map((text, i) => (i === 0 ? text : lowerFirst(text))).join(", or ");

/** One response per status: the guard's description first, then the entry's definitions, joined with ", or ". */
const errorResponses = (guards: readonly ErrorDefinition[], definitions: readonly ErrorDefinition[]): RouteConfig["responses"] => {
	const byStatus = new Map<number, string[]>();
	for (const definition of [...guards, ...definitions.filter((d) => !guards.includes(d))]) {
		byStatus.set(definition.status, [...(byStatus.get(definition.status) ?? []), definition.description]);
	}
	return Object.fromEntries(
		[...byStatus.entries()].sort(([a], [b]) => a - b).map(([status, descriptions]) => [String(status), errorJson(describe(descriptions))])
	);
};

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
				...errorResponses(guardErrors(r, auth), r.errors ?? []),
			},
		};
		registry.registerPath(r.spec ? r.spec(derived) : derived);
	}
};
