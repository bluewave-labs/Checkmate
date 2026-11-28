import type { ISsoController } from "@/api/controllers/ssoController.js";
import type { RouteTable } from "@/api/routes/defineRoutes.js";
import { ssoRefreshBodyValidation, ssoSessionResponseSchema } from "@/api/validation/ssoValidation.js";
import { ssoErrors } from "@/domain/sso/sso.errors.js";

export const ssoRoutes: RouteTable<ISsoController> = {
	prefix: "/sso",
	tag: "sso",
	auth: "none",
	routes: [
		{
			method: "post",
			path: "/refresh",
			handler: "refreshSession",
			summary: "Exchange a single sign-on refresh token for a new access token and refresh token",
			body: ssoRefreshBodyValidation,
			errors: [ssoErrors.sessionInvalid],
			response: ssoSessionResponseSchema,
		},
		{
			method: "post",
			path: "/logout",
			handler: "logoutSession",
			summary: "End a single sign-on session",
			body: ssoRefreshBodyValidation,
		},
	],
};
