import { IInviteController } from "@/api/controllers/inviteController.js";
import { RouteTable } from "@/api/routes/defineRoutes.js";
import { inviteBodyValidation, inviteVerificationBodyValidation } from "@/api/validation/authValidation.js";
import { inviteSchema } from "@/domain/invites/invite.schema.js";
import { inviteErrors } from "@/domain/invites/invite.errors.js";

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
			errors: [inviteErrors.emailRequired, inviteErrors.roleAboveCaller],
			roles: ["admin", "superadmin"],
			body: inviteBodyValidation,
		},
		{
			method: "post",
			path: "/verify",
			handler: "verifyInviteToken",
			summary: "Verify an invite token",
			errors: [inviteErrors.notFound],
			auth: "none",
			body: inviteVerificationBodyValidation,
			response: inviteSchema,
		},
		{
			method: "post",
			path: "/",
			handler: "getInviteToken",
			summary: "Create an invite token (admin/superadmin)",
			errors: [inviteErrors.roleAboveCaller],
			roles: ["admin", "superadmin"],
			body: inviteBodyValidation,
			response: inviteSchema,
		},
	],
};
