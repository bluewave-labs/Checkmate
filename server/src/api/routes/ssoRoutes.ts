import { ISsoController } from "@/api/controllers/ssoController.js";
import { RouteTable } from "@/api/routes/defineRoutes.js";
import { ssoConfigResponseSchema } from "@/api/validation/authValidation.js";
import { okJson } from "@/api/routes/openapiHelpers.js";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";

// Mounted at /api/v1/auth/sso ahead of the /api/v1/auth table so these routes get their own rate
// limit. A sign-in costs two requests, and the shared auth limiter is 15/min across every client
// behind a reverse proxy.
//
// start and callback are the only routes in the codebase that redirect rather than returning the
// { success, msg, data } envelope, because the browser is mid-navigation when they run. Their
// OpenAPI responses are overridden through the existing `spec` hook.
const redirectSpec =
	(description: string) =>
	(derived: RouteConfig): RouteConfig => {
		const { "200": _ok, ...errors } = derived.responses;
		return { ...derived, responses: { "302": { description }, ...errors } };
	};

export const ssoRoutes: RouteTable<ISsoController> = {
	prefix: "/auth/sso",
	tag: "auth",
	auth: "none",
	routes: [
		{
			method: "get",
			path: "/",
			handler: "getSsoConfig",
			summary: "Whether single sign-on is available, and how to label it",
			response: ssoConfigResponseSchema,
			spec: (d) => ({
				...d,
				responses: {
					...d.responses,
					"200": okJson(ssoConfigResponseSchema, "OK", { enabled: false, label: "", localLoginDisabled: false }),
				},
			}),
		},
		{
			method: "get",
			path: "/start",
			handler: "startSso",
			summary: "Begin single sign-on by redirecting to the identity provider",
			spec: redirectSpec("Redirect to the identity provider, or back to the login page when SSO is unavailable"),
		},
		{
			method: "get",
			path: "/callback",
			handler: "ssoCallback",
			summary: "Identity provider callback; redirects back to the application",
			spec: redirectSpec("Redirect to the application with a session token, or to the login page with an error code"),
		},
	],
};
