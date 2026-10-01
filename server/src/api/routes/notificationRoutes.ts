import { INotificationController } from "@/api/controllers/notificationController.js";
import { RouteTable } from "@/api/routes/defineRoutes.js";
import { json } from "@/api/routes/openapiHelpers.js";
import {
	createNotificationBodyValidation,
	deleteNotificationParamValidation,
	editNotificationParamValidation,
	getNotificationByIdParamValidation,
	notificationListResponseSchema,
	testAllNotificationsBodyValidation,
	testNotificationBodyValidation,
	testNotificationResponseEnvelope,
} from "@/api/validation/notificationValidation.js";
import { notificationSchema } from "@/domain/notifications/notification.schema.js";

export const notificationRoutes: RouteTable<INotificationController> = {
	prefix: "/notifications",
	tag: "notifications",
	auth: "jwt",
	routes: [
		{
			method: "post",
			path: "/",
			handler: "createNotification",
			summary: "Create a notification channel (admin/superadmin)",
			roles: ["admin", "superadmin"],
			body: createNotificationBodyValidation,
			response: notificationSchema,
		},
		{
			method: "post",
			path: "/test/all",
			handler: "testAllNotifications",
			summary: "Send a test alert through every notification channel for the team (admin/superadmin)",
			errors: { 400: "Invalid request, or the monitor has no notifications", 404: "Monitor not found" },
			roles: ["admin", "superadmin"],
			body: testAllNotificationsBodyValidation,
		},
		{
			method: "post",
			path: "/test",
			handler: "testNotification",
			summary: "Send a test alert through a single notification channel (admin/superadmin)",
			roles: ["admin", "superadmin"],
			body: testNotificationBodyValidation,
			spec: (d) => ({
				...d,
				responses: {
					...d.responses,
					"200": {
						description: "Send result",
						content: json(testNotificationResponseEnvelope, { success: true, msg: "Notification sent successfully" }),
					},
				},
			}),
		},
		{
			method: "get",
			path: "/team",
			handler: "getNotificationsByTeamId",
			summary: "List notification channels for the caller's team",
			response: notificationListResponseSchema,
		},
		{
			method: "get",
			path: "/:id",
			handler: "getNotificationById",
			summary: "Get a notification channel by id",
			errors: { 404: "Notification not found" },
			params: getNotificationByIdParamValidation,
			response: notificationSchema,
		},
		{
			method: "delete",
			path: "/:id",
			handler: "deleteNotification",
			summary: "Delete a notification channel (admin/superadmin)",
			errors: { 404: "Notification not found" },
			roles: ["admin", "superadmin"],
			params: deleteNotificationParamValidation,
		},
		{
			method: "patch",
			path: "/:id",
			handler: "editNotification",
			summary: "Edit a notification channel (admin/superadmin)",
			errors: { 404: "Notification not found" },
			roles: ["admin", "superadmin"],
			params: editNotificationParamValidation,
			body: createNotificationBodyValidation,
			response: notificationSchema,
		},
	],
};
