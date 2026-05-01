import { z } from "zod";
import { registry } from "../registry.js";
import { bearer, json, okJson, okJsonNoData, okUnknown, standardErrors } from "../helpers.js";
import {
	createNotificationBodyValidation,
	deleteNotificationParamValidation,
	getNotificationByIdParamValidation,
	editNotificationParamValidation,
	testAllNotificationsBodyValidation,
} from "@/validation/notificationValidation.js";

const tags = ["notifications"];

// OpenAPI metadata for each notification variant. Keyed by the discriminator
// value in createNotificationBodyValidation; build fails loudly if a variant
// in the validator has no entry here, which doubles as drift detection.
const notificationVariantMeta: Record<string, { component: string; example: Record<string, unknown> }> = {
	email: {
		component: "EmailNotification",
		example: { notificationName: "Ops on-call email", type: "email", address: "alerts@example.com" },
	},
	webhook: {
		component: "WebhookNotification",
		example: { notificationName: "Custom webhook", type: "webhook", address: "https://example.com/hooks/checkmate" },
	},
	slack: {
		component: "SlackNotification",
		example: { notificationName: "#alerts", type: "slack", address: "https://hooks.slack.com/services/T000/B000/XXXX" },
	},
	discord: {
		component: "DiscordNotification",
		example: { notificationName: "#status", type: "discord", address: "https://discord.com/api/webhooks/123/abc" },
	},
	pager_duty: {
		component: "PagerDutyNotification",
		example: { notificationName: "PagerDuty primary", type: "pager_duty", address: "R01XXXXXXXXXXXXXXXXXXXXXXX" },
	},
	matrix: {
		component: "MatrixNotification",
		example: {
			notificationName: "Matrix room",
			type: "matrix",
			homeserverUrl: "https://matrix.example.com",
			roomId: "!abc123:example.com",
			accessToken: "syt_xxx",
		},
	},
	teams: {
		component: "TeamsNotification",
		example: { notificationName: "Teams ops channel", type: "teams", address: "https://outlook.office.com/webhook/..." },
	},
	telegram: {
		component: "TelegramNotification",
		example: { notificationName: "Telegram bot", type: "telegram", address: "-1001234567890", accessToken: "123456:ABC-DEF" },
	},
	pushover: {
		component: "PushoverNotification",
		example: { notificationName: "Pushover personal", type: "pushover", address: "u1234567890abcdef", accessToken: "a1234567890abcdef" },
	},
	twilio: {
		component: "TwilioNotification",
		example: {
			notificationName: "Twilio SMS",
			type: "twilio",
			accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
			accessToken: "your-auth-token",
			phone: "+15551234567",
			twilioPhoneNumber: "+15557654321",
		},
	},
};

const decoratedVariants = createNotificationBodyValidation.options.map((variant) => {
	const typeField = variant.shape.type as z.ZodLiteral<string>;
	const type = typeField.value;
	const meta = notificationVariantMeta[type];
	if (!meta) {
		throw new Error(`Missing OpenAPI metadata for notification variant "${type}". Add an entry in notificationVariantMeta.`);
	}
	return variant.openapi(meta.component, { example: meta.example });
});

const notificationBody = z
	.discriminatedUnion("type", decoratedVariants as typeof createNotificationBodyValidation.options)
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
