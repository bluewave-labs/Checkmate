import { z } from "zod";

//****************************************
// Notification Validations
//****************************************

// Individual notification schemas
const emailSchema = z.object({
	notificationName: z.string().min(1, "Notification name is required"),
	type: z.literal("email"),
	address: z.email("Please enter a valid e-mail address"),
	homeserverUrl: z.union([z.string(), z.literal("")]).optional(),
	roomId: z.union([z.string(), z.literal("")]).optional(),
	accessToken: z.union([z.string(), z.literal("")]).optional(),
});

const webhookSchema = z.object({
	notificationName: z.string().min(1, "Notification name is required"),
	type: z.literal("webhook"),
	address: z.url({ message: "Please enter a valid Webhook URL" }),
	homeserverUrl: z.union([z.string(), z.literal("")]).optional(),
	roomId: z.union([z.string(), z.literal("")]).optional(),
	accessToken: z.union([z.string(), z.literal("")]).optional(),
});

const slackSchema = z.object({
	notificationName: z.string().min(1, "Notification name is required"),
	type: z.literal("slack"),
	address: z.url({ message: "Please enter a valid Webhook URL" }),
	homeserverUrl: z.union([z.string(), z.literal("")]).optional(),
	roomId: z.union([z.string(), z.literal("")]).optional(),
	accessToken: z.union([z.string(), z.literal("")]).optional(),
});

const discordSchema = z.object({
	notificationName: z.string().min(1, "Notification name is required"),
	type: z.literal("discord"),
	address: z.url({ message: "Please enter a valid Webhook URL" }),
	homeserverUrl: z.union([z.string(), z.literal("")]).optional(),
	roomId: z.union([z.string(), z.literal("")]).optional(),
	accessToken: z.union([z.string(), z.literal("")]).optional(),
});

const pagerDutySchema = z.object({
	notificationName: z.string().min(1, "Notification name is required"),
	type: z.literal("pager_duty"),
	address: z.string().min(1, "PagerDuty integration key is required"),
	homeserverUrl: z.union([z.string(), z.literal("")]).optional(),
	roomId: z.union([z.string(), z.literal("")]).optional(),
	accessToken: z.union([z.string(), z.literal("")]).optional(),
});

const matrixSchema = z.object({
	notificationName: z.string().min(1, "Notification name is required"),
	type: z.literal("matrix"),
	address: z.union([z.string(), z.literal("")]).optional(),
	homeserverUrl: z.url({ message: "Please enter a valid Homeserver URL" }),
	roomId: z.string().min(1, "Room ID is required"),
	accessToken: z.string().min(1, "Access Token is required"),
});

const teamsSchema = z.object({
	notificationName: z.string().min(1, "Notification name is required"),
	type: z.literal("teams"),
	address: z.url({ message: "Please enter a valid Webhook URL" }),
});

const telegramSchema = z.object({
	notificationName: z.string().min(1, "Notification name is required"),
	type: z.literal("telegram"),
	address: z.string().min(1, "Chat ID is required"),
	accessToken: z.string().min(1, "Bot token is required"),
});

const pushoverSchema = z.object({
	notificationName: z.string().min(1, "Notification name is required"),
	type: z.literal("pushover"),
	address: z.string().min(1, "User key is required"),
	accessToken: z.string().min(1, "App token is required"),
});

const twilioSchema = z.object({
	notificationName: z.string().min(1, "Notification name is required"),
	type: z.literal("twilio"),
	accountSid: z.string().min(1, "Account SID is required"),
	accessToken: z.string().min(1, "Auth token is required"),
	phone: z.string().min(1, "Recipient phone number is required"),
	twilioPhoneNumber: z.string().min(1, "Twilio phone number is required"),
});

// Create validation — all fields required
export const createNotificationBodyValidation = z.discriminatedUnion("type", [
	emailSchema,
	webhookSchema,
	slackSchema,
	discordSchema,
	pagerDutySchema,
	matrixSchema,
	teamsSchema,
	telegramSchema,
	pushoverSchema,
	twilioSchema,
]);

// Edit validation — sensitive fields optional (already stored in DB)
export const editNotificationBodyValidation = z.discriminatedUnion("type", [
	emailSchema,
	webhookSchema,
	slackSchema,
	discordSchema,
	pagerDutySchema,
	matrixSchema.partial({ accessToken: true }),
	teamsSchema,
	telegramSchema.partial({ accessToken: true }),
	pushoverSchema.partial({ accessToken: true }),
	twilioSchema.partial({ accessToken: true, accountSid: true }),
]);

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
