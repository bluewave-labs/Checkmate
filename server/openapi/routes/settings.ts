import { registry } from "../registry.js";
import { bearer, json, okJsonNoData, okUnknown, standardErrors } from "../helpers.js";
import { updateAppSettingsBodyValidation } from "@/validation/settingsValidation.js";
import { sendTestEmailBodyValidation } from "@/validation/notificationValidation.js";

const tags = ["settings"];

registry.registerPath({
	method: "get",
	path: "/settings",
	tags,
	summary: "Get application settings",
	security: bearer,
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "patch",
	path: "/settings",
	tags,
	summary: "Update application settings (admin/superadmin)",
	security: bearer,
	request: { body: { content: json(updateAppSettingsBodyValidation) } },
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "post",
	path: "/settings/test-email",
	tags,
	summary: "Send a test email using current SMTP settings (admin/superadmin)",
	security: bearer,
	request: { body: { content: json(sendTestEmailBodyValidation) } },
	responses: { "200": okJsonNoData(), ...standardErrors },
});
