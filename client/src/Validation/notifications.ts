import { z } from "zod";

const baseSchema = z.object({
	notificationName: z
		.string()
		.min(1, "Notification name is required")
		.max(100, "Notification name must be at most 100 characters"),
});

const emailSchema = baseSchema.extend({
	type: z.literal("email"),
	address: z
		.string()
		.min(1, "Email is required")
		.email("Please enter a valid email address"),
});

const slackSchema = baseSchema.extend({
	type: z.literal("slack"),
	address: z.string().min(1, "Webhook URL is required").url("Please enter a valid URL"),
});

const discordSchema = baseSchema.extend({
	type: z.literal("discord"),
	address: z.string().min(1, "Webhook URL is required").url("Please enter a valid URL"),
});

const webhookSchema = baseSchema.extend({
	type: z.literal("webhook"),
	address: z.string().min(1, "Webhook URL is required").url("Please enter a valid URL"),
});

const pagerDutySchema = baseSchema.extend({
	type: z.literal("pager_duty"),
	address: z.string().min(1, "Integration key is required"),
});

const matrixSchema = baseSchema.extend({
	type: z.literal("matrix"),
	homeserverUrl: z
		.string()
		.min(1, "Homeserver URL is required")
		.url("Please enter a valid URL"),
	roomId: z.string().min(1, "Room ID is required"),
	accessToken: z.string().min(1, "Access token is required"),
});

const teamsSchema = baseSchema.extend({
	type: z.literal("teams"),
	address: z.string().min(1, "Webhook URL is required").url("Please enter a valid URL"),
});

const telegramSchema = baseSchema.extend({
	type: z.literal("telegram"),
	address: z.string().min(1, "Chat ID is required"),
	accessToken: z.string().min(1, "Bot token is required"),
});

const pushoverSchema = baseSchema.extend({
	type: z.literal("pushover"),
	address: z.string().min(1, "User key is required"),
	accessToken: z.string().min(1, "App token is required"),
});

export const notificationSchema = z.discriminatedUnion("type", [
	emailSchema,
	slackSchema,
	discordSchema,
	webhookSchema,
	pagerDutySchema,
	matrixSchema,
	teamsSchema,
	telegramSchema,
	pushoverSchema,
]);

export type NotificationFormData = z.infer<typeof notificationSchema>;
