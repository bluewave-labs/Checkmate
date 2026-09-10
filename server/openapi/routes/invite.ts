import { registry } from "../registry.js";
import { bearer, json, okJson, okJsonNoData, standardErrors } from "../helpers.js";
import { z } from "zod";
import {
	inviteBodyValidation,
	inviteVerificationBodyValidation,
	inviteIdParamValidation,
	updateInviteExpiryBodyValidation,
} from "@/api/validation/authValidation.js";

const tags = ["invite"];

const inviteResponseSchema = z
	.object({
		id: z.string(),
		email: z.string(),
		teamId: z.string(),
		role: z.array(z.string()),
		expiry: z.string(),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.passthrough();

registry.registerPath({
	method: "post",
	path: "/invite/send",
	tags,
	summary: "Send an invite email (admin/superadmin)",
	security: bearer,
	request: { body: { content: json(inviteBodyValidation) } },
	responses: { "200": okJsonNoData(), ...standardErrors },
});

registry.registerPath({
	method: "post",
	path: "/invite/verify",
	tags,
	summary: "Verify an invite token",
	request: { body: { content: json(inviteVerificationBodyValidation) } },
	responses: { "200": okJson(z.object({ email: z.string(), role: z.array(z.string()).optional() }).passthrough()), "500": standardErrors["500"] },
});

registry.registerPath({
	method: "post",
	path: "/invite",
	tags,
	summary: "Create an invite token (admin/superadmin)",
	security: bearer,
	request: { body: { content: json(inviteBodyValidation) } },
	responses: { "200": okJson(z.object({ token: z.string() }).passthrough()), ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/invite",
	tags,
	summary: "List pending invites for the team (admin/superadmin)",
	security: bearer,
	responses: { "200": okJson(z.array(inviteResponseSchema)), ...standardErrors },
});

registry.registerPath({
	method: "patch",
	path: "/invite/{id}/expiry",
	tags,
	summary: "Change how long an invite stays valid for (admin/superadmin)",
	security: bearer,
	request: {
		params: inviteIdParamValidation,
		body: { content: json(updateInviteExpiryBodyValidation) },
	},
	responses: { "200": okJson(inviteResponseSchema), "404": { description: "Not found", content: json(z.object({ success: z.literal(false), msg: z.string() })) }, ...standardErrors },
});
