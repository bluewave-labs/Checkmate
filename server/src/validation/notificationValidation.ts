import { error } from "node:console";
import { z } from "zod";

//****************************************
// Notification Validations
//****************************************

export const createNotificationBodyValidation = z.discriminatedUnion("type", [
	// Email notification
	z.object({
		notificationName: z.string().min(1, "Notification name is required"),
		type: z.literal("email"),
		address: z.email("Please enter a valid e-mail address"),
		homeserverUrl: z.union([z.string(), z.literal("")]).optional(),
		roomId: z.union([z.string(), z.literal("")]).optional(),
		accessToken: z.union([z.string(), z.literal("")]).optional(),
	}),
	// Webhook notification
	z.object({
		notificationName: z.string().min(1, "Notification name is required"),
		type: z.literal("webhook"),
		address: z.string().url("Please enter a valid Webhook URL"),
		homeserverUrl: z.union([z.string(), z.literal("")]).optional(),
		roomId: z.union([z.string(), z.literal("")]).optional(),
		accessToken: z.union([z.string(), z.literal("")]).optional(),
	}),
	// Slack notification
	z.object({
		notificationName: z.string().min(1, "Notification name is required"),
		type: z.literal("slack"),
		address: z.string().url("Please enter a valid Webhook URL"),
		homeserverUrl: z.union([z.string(), z.literal("")]).optional(),
		roomId: z.union([z.string(), z.literal("")]).optional(),
		accessToken: z.union([z.string(), z.literal("")]).optional(),
	}),
	// Discord notification
	z.object({
		notificationName: z.string().min(1, "Notification name is required"),
		type: z.literal("discord"),
		address: z.string().url("Please enter a valid Webhook URL"),
		homeserverUrl: z.union([z.string(), z.literal("")]).optional(),
		roomId: z.union([z.string(), z.literal("")]).optional(),
		accessToken: z.union([z.string(), z.literal("")]).optional(),
	}),
	// PagerDuty notification
	z.object({
		notificationName: z.string().min(1, "Notification name is required"),
		type: z.literal("pager_duty"),
		address: z.string().min(1, "PagerDuty integration key is required"),
		homeserverUrl: z.union([z.string(), z.literal("")]).optional(),
		roomId: z.union([z.string(), z.literal("")]).optional(),
		accessToken: z.union([z.string(), z.literal("")]).optional(),
	}),
	// Matrix notification
	z.object({
		notificationName: z.string().min(1, "Notification name is required"),
		type: z.literal("matrix"),
		address: z.union([z.string(), z.literal("")]).optional(),
		homeserverUrl: z.string().url("Please enter a valid Homeserver URL"),
		roomId: z.string().min(1, "Room ID is required"),
		accessToken: z.string().min(1, "Access Token is required"),
	}),
]);

export const sendTestEmailBodyValidation = z.object({
	to: z.string().min(1, "To field is required"),
	systemEmailHost: z.string().optional(),
	systemEmailPort: z.number().optional(),
	systemEmailSecure: z.boolean().optional(),
	systemEmailPool: z.boolean().optional(),
	systemEmailAddress: z.string().optional(),
	systemEmailPassword: z.string().optional(),
	systemEmailUser: z.string().optional(),
	systemEmailConnectionHost: z.union([z.string(), z.literal("")]).optional(),
	systemEmailIgnoreTLS: z.boolean().optional(),
	systemEmailRequireTLS: z.boolean().optional(),
	systemEmailRejectUnauthorized: z.boolean().optional(),
	systemEmailTLSServername: z.union([z.string(), z.literal("")]).optional(),
});

export const bulkEditNotificationBodyValidation = z.object({
	monitorIds: z.array(z.string()).min(1, "At least one monitor ID is required"),
	notificationIds: z.array(z.string()),
	action: z.enum(["add", "remove", "set"], {
		errorMap: () => ({message: "Action must be 'add', 'remove', or 'set'"})
	}),
});