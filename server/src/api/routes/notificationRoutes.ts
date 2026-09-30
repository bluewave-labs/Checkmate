import { INotificationController } from "@/api/controllers/notificationController.js";
import { RouteTable } from "@/api/routes/defineRoutes.js";
import { unknownResponseSchema } from "@/api/routes/openapiHelpers.js";
import {
	createNotificationBodyValidation,
	deleteNotificationParamValidation,
	editNotificationParamValidation,
	getNotificationByIdParamValidation,
	testAllNotificationsBodyValidation,
	testNotificationBodyValidation,
} from "@/api/validation/notificationValidation.js";

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
			response: unknownResponseSchema,
		},
		{
			method: "post",
			path: "/test/all",
			handler: "testAllNotifications",
			summary: "Send a test alert through every notification channel for the team (admin/superadmin)",
			roles: ["admin", "superadmin"],
			body: testAllNotificationsBodyValidation,
			response: unknownResponseSchema,
		},
		{
			method: "post",
			path: "/test",
			handler: "testNotification",
			summary: "Send a test alert through a single notification channel (admin/superadmin)",
			roles: ["admin", "superadmin"],
			body: testNotificationBodyValidation,
			response: unknownResponseSchema,
		},
		{
			method: "get",
			path: "/team",
			handler: "getNotificationsByTeamId",
			summary: "List notification channels for the caller's team",
			response: unknownResponseSchema,
		},
		{
			method: "get",
			path: "/:id",
			handler: "getNotificationById",
			summary: "Get a notification channel by id",
			params: getNotificationByIdParamValidation,
			response: unknownResponseSchema,
		},
		{
			method: "delete",
			path: "/:id",
			handler: "deleteNotification",
			summary: "Delete a notification channel (admin/superadmin)",
			roles: ["admin", "superadmin"],
			params: deleteNotificationParamValidation,
		},
		{
			method: "patch",
			path: "/:id",
			handler: "editNotification",
			summary: "Edit a notification channel (admin/superadmin)",
			roles: ["admin", "superadmin"],
			params: editNotificationParamValidation,
			body: createNotificationBodyValidation,
			response: unknownResponseSchema,
		},
	],
};
