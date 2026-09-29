import { z } from "zod";
import { NtfyAuthTypes } from "@/domain/notifications/notification.type.js";

//****************************************
// Notification Validations
//****************************************

// ntfy stores its secret in accessToken for both auth types: the bearer token for
// "token", the password for "basic". Reject partially filled credentials so a channel
// can't be saved looking authenticated while posting anonymously.
const refineNtfyAuth = (body: { ntfyAuthType?: string; ntfyUsername?: string; accessToken?: string }, ctx: z.RefinementCtx) => {
	const authType = body.ntfyAuthType ?? "none";

	if (authType === "none") {
		if (body.accessToken) {
			ctx.addIssue({ code: "custom", path: ["accessToken"], message: "Select an authentication type to use an access token" });
		}
		if (body.ntfyUsername) {
			ctx.addIssue({ code: "custom", path: ["ntfyUsername"], message: "Select an authentication type to use a username" });
		}
		return;
	}

	if (authType === "token") {
		if (!body.accessToken) {
			ctx.addIssue({ code: "custom", path: ["accessToken"], message: "Access token is required for token authentication" });
		}
		if (body.ntfyUsername) {
			ctx.addIssue({ code: "custom", path: ["ntfyUsername"], message: "Username is only used with basic authentication" });
		}
		return;
	}

	if (!body.ntfyUsername) {
		ctx.addIssue({ code: "custom", path: ["ntfyUsername"], message: "Username is required for basic authentication" });
	}
	if (!body.accessToken) {
		ctx.addIssue({ code: "custom", path: ["accessToken"], message: "Password is required for basic authentication" });
	}
};

const notificationChannelVariants = z.discriminatedUnion("type", [
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
		address: z.url({ message: "Please enter a valid Webhook URL" }),
		homeserverUrl: z.union([z.string(), z.literal("")]).optional(),
		roomId: z.union([z.string(), z.literal("")]).optional(),
		accessToken: z.union([z.string(), z.literal("")]).optional(),
	}),
	// Rocket.Chat notification
	z.object({
		notificationName: z.string().min(1, "Notification name is required"),
		type: z.literal("rocket_chat"),
		address: z.url({
			protocol: /^https?$/,
			message: "Please enter a valid Rocket.Chat webhook URL",
		}),
	}),
	// Slack notification
	z.object({
		notificationName: z.string().min(1, "Notification name is required"),
		type: z.literal("slack"),
		address: z.url({ message: "Please enter a valid Webhook URL" }),
		homeserverUrl: z.union([z.string(), z.literal("")]).optional(),
		roomId: z.union([z.string(), z.literal("")]).optional(),
		accessToken: z.union([z.string(), z.literal("")]).optional(),
	}),
	// Discord notification
	z.object({
		notificationName: z.string().min(1, "Notification name is required"),
		type: z.literal("discord"),
		address: z.url({ message: "Please enter a valid Webhook URL" }),
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
		homeserverUrl: z.url({ message: "Please enter a valid Homeserver URL" }),
		roomId: z.string().min(1, "Room ID is required"),
		accessToken: z.string().min(1, "Access Token is required"),
	}),
	// Teams notification
	z.object({
		notificationName: z.string().min(1, "Notification name is required"),
		type: z.literal("teams"),
		address: z.url({ message: "Please enter a valid Webhook URL" }),
	}),
	// Telegram notification
	z.object({
		notificationName: z.string().min(1, "Notification name is required"),
		type: z.literal("telegram"),
		address: z.string().min(1, "Chat ID is required"),
		accessToken: z.string().min(1, "Bot token is required"),
	}),
	// Pushover notification
	z.object({
		notificationName: z.string().min(1, "Notification name is required"),
		type: z.literal("pushover"),
		address: z.string().min(1, "User key is required"),
		accessToken: z.string().min(1, "App token is required"),
	}),
	// Signalgrid notification
	z.object({
		notificationName: z.string().min(1, "Notification name is required"),
		type: z.literal("signalgrid"),
		address: z.string().min(1, "Channel is required"),
		accessToken: z.string().min(1, "Client key is required"),
	}),
	// Twilio SMS notification
	z.object({
		notificationName: z.string().min(1, "Notification name is required"),
		type: z.literal("twilio"),
		accountSid: z.string().min(1, "Account SID is required"),
		accessToken: z.string().min(1, "Auth token is required"),
		phone: z.string().min(1, "Recipient phone number is required"),
		twilioPhoneNumber: z.string().min(1, "Twilio phone number is required"),
	}),
	// ntfy notification
	z
		.object({
			notificationName: z.string().min(1, "Notification name is required"),
			type: z.literal("ntfy"),
			address: z.url({ message: "Please enter a valid ntfy server URL" }),
			topic: z.string().min(1, "Topic is required"),
			ntfyAuthType: z.enum(NtfyAuthTypes).optional(),
			ntfyUsername: z.union([z.string(), z.literal("")]).optional(),
			accessToken: z.union([z.string(), z.literal("")]).optional(),
		})
		.superRefine(refineNtfyAuth),
]);

// OpenAPI component name and example per notification variant, keyed by the
// discriminator value. Server start fails loudly if a variant has no entry here.
const notificationVariantMeta: Record<string, { component: string; example: Record<string, unknown> }> = {
	email: {
		component: "EmailNotification",
		example: { notificationName: "Ops on-call email", type: "email", address: "alerts@example.com" },
	},
	webhook: {
		component: "WebhookNotification",
		example: { notificationName: "Custom webhook", type: "webhook", address: "https://example.com/hooks/checkmate" },
	},
	rocket_chat: {
		component: "RocketChatNotification",
		example: {
			notificationName: "Rocket.Chat alerts",
			type: "rocket_chat",
			address: "https://chat.example.com/hooks/integration-id/token",
		},
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
	signalgrid: {
		component: "SignalgridNotification",
		example: { notificationName: "Signalgrid", type: "signalgrid", address: "your-channel", accessToken: "your-client-key" },
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
	ntfy: {
		component: "NtfyNotification",
		example: {
			notificationName: "ntfy topic",
			type: "ntfy",
			address: "https://ntfy.sh",
			topic: "checkmate-alerts",
			ntfyAuthType: "token",
			accessToken: "tk_your-ntfy-access-token",
		},
	},
};

const decoratedVariants = notificationChannelVariants.options.map((variant) => {
	const type = (variant.shape.type as z.ZodLiteral<string>).value;
	const meta = notificationVariantMeta[type];
	if (!meta) {
		throw new Error(`Missing OpenAPI metadata for notification variant "${type}". Add an entry in notificationVariantMeta.`);
	}
	return variant.meta({ id: meta.component, example: meta.example });
});

export const createNotificationBodyValidation = z
	.discriminatedUnion("type", decoratedVariants as typeof notificationChannelVariants.options)
	.meta({ id: "NotificationChannelBody" });

export const testNotificationBodyValidation = createNotificationBodyValidation;

export const deleteNotificationParamValidation = z.object({
	id: z.string().min(1, "Notification ID is required"),
});
export const getNotificationByIdParamValidation = z.object({
	id: z.string().min(1, "Notification ID is required"),
});
export const editNotificationParamValidation = z.object({
	id: z.string().min(1, "Notification ID is required"),
});

export const testAllNotificationsBodyValidation = z.object({
	monitorId: z.string().min(1, "Monitor ID is required"),
});

export const sendTestEmailBodyValidation = z.object({
	to: z.string().min(1, "To field is required"),
	systemEmailHost: z.string().optional(),
	systemEmailPort: z.number().optional(),
	systemEmailSecure: z.boolean().default(false),
	systemEmailPool: z.boolean().default(false),
	systemEmailAddress: z.string().optional(),
	systemEmailDisplayName: z.string().optional(),
	systemEmailPassword: z.string().optional(),
	systemEmailUser: z.string().optional(),
	systemEmailConnectionHost: z.union([z.string(), z.literal("")]).optional(),
	systemEmailIgnoreTLS: z.boolean().default(false),
	systemEmailRequireTLS: z.boolean().default(false),
	systemEmailRejectUnauthorized: z.boolean().default(true),
	systemEmailTLSServername: z.union([z.string(), z.literal("")]).optional(),
});

export const updateNotificationsValidation = z
	.object({
		monitorIds: z.array(z.string()).min(1, "At least one monitor ID is required").max(100, "Cannot update more than 100 monitors at once"),
		notificationIds: z.array(z.string()).max(100, "Cannot specify more than 100 notification IDs at once"),
		action: z.enum(["add", "remove", "set"] as const),
	})
	.refine(
		(data) => {
			if (data.action !== "set" && data.notificationIds.length === 0) return false;
			return true;
		},
		{
			message: "Notification IDs cannot be empty unless action is 'set'",
			path: ["notificationIds"],
		}
	);
