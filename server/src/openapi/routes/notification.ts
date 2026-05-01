import { z } from "zod";
import { registry } from "../registry.js";
import { bearer, json, okJson, okJsonNoData, okUnknown, standardErrors } from "../helpers.js";
import {
	deleteNotificationParamValidation,
	getNotificationByIdParamValidation,
	editNotificationParamValidation,
	testAllNotificationsBodyValidation,
} from "@/validation/notificationValidation.js";

const tags = ["notifications"];

const optionalString = z.union([z.string(), z.literal("")]).optional();

const emailNotification = z
	.object({
		notificationName: z.string().min(1).openapi({ example: "Ops on-call email" }),
		type: z.literal("email"),
		address: z.email().openapi({ example: "alerts@example.com" }),
		homeserverUrl: optionalString,
		roomId: optionalString,
		accessToken: optionalString,
	})
	.openapi("EmailNotification");

const webhookNotification = z
	.object({
		notificationName: z.string().min(1).openapi({ example: "Custom webhook" }),
		type: z.literal("webhook"),
		address: z.url().openapi({ example: "https://example.com/hooks/checkmate" }),
		homeserverUrl: optionalString,
		roomId: optionalString,
		accessToken: optionalString,
	})
	.openapi("WebhookNotification");

const slackNotification = z
	.object({
		notificationName: z.string().min(1).openapi({ example: "#alerts" }),
		type: z.literal("slack"),
		address: z.url().openapi({ example: "https://hooks.slack.com/services/T000/B000/XXXX" }),
		homeserverUrl: optionalString,
		roomId: optionalString,
		accessToken: optionalString,
	})
	.openapi("SlackNotification");

const discordNotification = z
	.object({
		notificationName: z.string().min(1).openapi({ example: "#status" }),
		type: z.literal("discord"),
		address: z.url().openapi({ example: "https://discord.com/api/webhooks/123/abc" }),
		homeserverUrl: optionalString,
		roomId: optionalString,
		accessToken: optionalString,
	})
	.openapi("DiscordNotification");

const pagerDutyNotification = z
	.object({
		notificationName: z.string().min(1).openapi({ example: "PagerDuty primary" }),
		type: z.literal("pager_duty"),
		address: z.string().min(1).openapi({ example: "R01XXXXXXXXXXXXXXXXXXXXXXX" }),
		homeserverUrl: optionalString,
		roomId: optionalString,
		accessToken: optionalString,
	})
	.openapi("PagerDutyNotification");

const matrixNotification = z
	.object({
		notificationName: z.string().min(1).openapi({ example: "Matrix room" }),
		type: z.literal("matrix"),
		address: optionalString,
		homeserverUrl: z.url().openapi({ example: "https://matrix.example.com" }),
		roomId: z.string().min(1).openapi({ example: "!abc123:example.com" }),
		accessToken: z.string().min(1).openapi({ example: "syt_xxx" }),
	})
	.openapi("MatrixNotification");

const teamsNotification = z
	.object({
		notificationName: z.string().min(1).openapi({ example: "Teams ops channel" }),
		type: z.literal("teams"),
		address: z.url().openapi({ example: "https://outlook.office.com/webhook/..." }),
	})
	.openapi("TeamsNotification");

const telegramNotification = z
	.object({
		notificationName: z.string().min(1).openapi({ example: "Telegram bot" }),
		type: z.literal("telegram"),
		address: z.string().min(1).openapi({ example: "-1001234567890" }),
		accessToken: z.string().min(1).openapi({ example: "123456:ABC-DEF" }),
	})
	.openapi("TelegramNotification");

const pushoverNotification = z
	.object({
		notificationName: z.string().min(1).openapi({ example: "Pushover personal" }),
		type: z.literal("pushover"),
		address: z.string().min(1).openapi({ example: "u1234567890abcdef" }),
		accessToken: z.string().min(1).openapi({ example: "a1234567890abcdef" }),
	})
	.openapi("PushoverNotification");

const twilioNotification = z
	.object({
		notificationName: z.string().min(1).openapi({ example: "Twilio SMS" }),
		type: z.literal("twilio"),
		accountSid: z.string().min(1).openapi({ example: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }),
		accessToken: z.string().min(1).openapi({ example: "your-auth-token" }),
		phone: z.string().min(1).openapi({ example: "+15551234567" }),
		twilioPhoneNumber: z.string().min(1).openapi({ example: "+15557654321" }),
	})
	.openapi("TwilioNotification");

const notificationBody = z
	.discriminatedUnion("type", [
		emailNotification,
		webhookNotification,
		slackNotification,
		discordNotification,
		pagerDutyNotification,
		matrixNotification,
		teamsNotification,
		telegramNotification,
		pushoverNotification,
		twilioNotification,
	])
	.openapi("NotificationChannelBody");

registry.registerPath({
	method: "post",
	path: "/notifications",
	tags,
	summary: "Create a notification channel",
	description: "Create a notification channel of any supported type. The `type` field discriminates the body shape.",
	security: bearer,
	request: { body: { content: json(notificationBody) } },
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "post",
	path: "/notifications/test/all",
	tags,
	summary: "Send a test alert through every notification channel for the team",
	security: bearer,
	request: { body: { content: json(testAllNotificationsBodyValidation) } },
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "post",
	path: "/notifications/test",
	tags,
	summary: "Send a test alert through a single notification channel",
	security: bearer,
	request: { body: { content: json(notificationBody) } },
	responses: { "200": okJson(z.object({ success: z.boolean() }).passthrough()), ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/notifications/team",
	tags,
	summary: "List notification channels for the caller's team",
	security: bearer,
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/notifications/{id}",
	tags,
	summary: "Get a notification channel by id",
	security: bearer,
	request: { params: getNotificationByIdParamValidation },
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "delete",
	path: "/notifications/{id}",
	tags,
	summary: "Delete a notification channel",
	security: bearer,
	request: { params: deleteNotificationParamValidation },
	responses: { "200": okJsonNoData(), ...standardErrors },
});

registry.registerPath({
	method: "patch",
	path: "/notifications/{id}",
	tags,
	summary: "Edit a notification channel",
	security: bearer,
	request: { params: editNotificationParamValidation, body: { content: json(notificationBody) } },
	responses: { "200": okUnknown, ...standardErrors },
});
