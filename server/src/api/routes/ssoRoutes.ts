import type { ISsoController } from "@/api/controllers/ssoController.js";
import type { RouteTable } from "@/api/routes/defineRoutes.js";
import {
	ssoRedeemBodyValidation,
	ssoRefreshBodyValidation,
	ssoSessionResponseSchema,
	ssoStartBodyValidation,
	ssoStartResponseSchema,
	ssoStatusResponseSchema,
} from "@/api/validation/ssoValidation.js";
import { ssoErrors } from "@/domain/sso/sso.errors.js";
import { userErrors } from "@/domain/users/user.errors.js";
import { connectErrors } from "@/domain/connect/connect.errors.js";

export const ssoRoutes: RouteTable<ISsoController> = {
	prefix: "/sso",
	tag: "sso",
	auth: "none",
	routes: [
		{
			method: "get",
			path: "/status",
			handler: "getSsoStatus",
			summary: "Report whether single sign-on is available and how to label the button",
			response: ssoStatusResponseSchema,
		},
		{
			method: "post",
			path: "/start",
			handler: "startSso",
			summary: "Begin a single sign-on login and get the Connect address to send the browser to",
			body: ssoStartBodyValidation,
			errors: [ssoErrors.disabled, ssoErrors.invalidReturnOrigin],
			response: ssoStartResponseSchema,
		},
		{
			method: "post",
			path: "/redeem",
			handler: "redeemSso",
			summary: "Exchange the single-use code from Connect for a Checkmate session",
			body: ssoRedeemBodyValidation,
			errors: [
				ssoErrors.stateInvalid,
				ssoErrors.codeInvalid,
				ssoErrors.disabled,
				ssoErrors.superadminNotAllowed,
				ssoErrors.accountConflict,
				ssoErrors.notSetUp,
				userErrors.accountInactive,
				userErrors.notFound,
				connectErrors.connectUnreachable,
			],
			response: ssoSessionResponseSchema,
		},
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
