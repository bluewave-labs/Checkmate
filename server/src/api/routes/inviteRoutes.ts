import { RequestHandler, Router } from "express";
import { isAllowed } from "../middleware/isAllowed.js";
import { IInviteController } from "@/api/controllers/inviteController.js";
import { RouteTable } from "@/api/routes/defineRoutes.js";
import { inviteBodyValidation, inviteVerificationBodyValidation } from "@/api/validation/authValidation.js";
import { unknownResponseSchema } from "@/api/routes/openapiHelpers.js";

export const inviteRoutes: RouteTable<IInviteController> = {
	prefix: "/invite",
	tag: "invite",
	auth: "jwt",
	routes: [
		{
			method: "post",
			path: "/send",
			handler: "sendInviteEmail",
			summary: "Send an invite email (admin/superadmin)",
			roles: ["admin", "superadmin"],
			body: inviteBodyValidation,
		},
		{
			method: "post",
			path: "/verify",
			handler: "verifyInviteToken",
			summary: "Verify an invite token",
			auth: "none",
			body: inviteVerificationBodyValidation,
			response: unknownResponseSchema,
		},
		{
			method: "post",
			path: "/",
			handler: "getInviteToken",
			summary: "Create an invite token (admin/superadmin)",
			roles: ["admin", "superadmin"],
			body: inviteBodyValidation,
			response: unknownResponseSchema,
		},
	],
};
