import { registry } from "../registry.js";
import { bearer, json, okJson, okJsonNoData, standardErrors } from "../helpers.js";
import { z } from "zod";
import { inviteBodyValidation, inviteVerificationBodyValidation } from "@/validation/authValidation.js";

const tags = ["invite"];

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
