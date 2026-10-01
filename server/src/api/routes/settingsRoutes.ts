import { ISettingsController } from "@/api/controllers/settingsController.js";
import { RouteTable } from "@/api/routes/defineRoutes.js";
import { appSettingsResponseSchema, testEmailResponseSchema, updateAppSettingsBodyValidation } from "@/api/validation/settingsValidation.js";
import { sendTestEmailBodyValidation } from "@/api/validation/notificationValidation.js";

export const settingsRoutes: RouteTable<ISettingsController> = {
	prefix: "/settings",
	tag: "settings",
	auth: "jwt",
	routes: [
		{
			method: "get",
			path: "/",
			handler: "getAppSettings",
			summary: "Get application settings",
			response: appSettingsResponseSchema,
		},
		{
			method: "patch",
			path: "/",
			handler: "updateAppSettings",
			summary: "Update application settings (admin/superadmin)",
			errors: { 422: "Referenced proxy does not exist" },
			roles: ["admin", "superadmin"],
			body: updateAppSettingsBodyValidation,
			response: appSettingsResponseSchema,
		},
		{
			method: "post",
			path: "/test-email",
			handler: "sendTestEmail",
			summary: "Send a test email using current SMTP settings (admin/superadmin)",
			roles: ["admin", "superadmin"],
			body: sendTestEmailBodyValidation,
			response: testEmailResponseSchema,
		},
	],
};
