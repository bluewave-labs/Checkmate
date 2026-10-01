import { IInviteController } from "@/api/controllers/inviteController.js";
import { RouteTable } from "@/api/routes/defineRoutes.js";
import { inviteBodyValidation, inviteVerificationBodyValidation } from "@/api/validation/authValidation.js";
import { inviteSchema } from "@/domain/invites/invite.schema.js";

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
			errors: { 400: "Invite email is required", 403: "Caller lacks the role, or the invited role is above the caller's" },
			roles: ["admin", "superadmin"],
			body: inviteBodyValidation,
		},
		{
			method: "post",
			path: "/verify",
			handler: "verifyInviteToken",
			summary: "Verify an invite token",
			errors: { 404: "Invite not found" },
			auth: "none",
			body: inviteVerificationBodyValidation,
			response: inviteSchema,
		},
		{
			method: "post",
			path: "/",
			handler: "getInviteToken",
			summary: "Create an invite token (admin/superadmin)",
			errors: { 403: "Caller lacks the role, or the invited role is above the caller's" },
			roles: ["admin", "superadmin"],
			body: inviteBodyValidation,
			response: inviteSchema,
		},
	],
};
