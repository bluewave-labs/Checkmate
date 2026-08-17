import { z } from "zod";
import { NotificationChannels } from "@/domain/notifications/notification.type.js";

//****************************************
// Notification Validations
//****************************************

const notificationName = z.string().min(1, "Notification name is required");

// Matrix fields that the simpler channels also accept but never use. Declared once and shared so
// bodies posted by the existing form keep validating.
const unusedMatrixFields = {
	homeserverUrl: z.union([z.string(), z.literal("")]).optional(),
	roomId: z.union([z.string(), z.literal("")]).optional(),
	accessToken: z.union([z.string(), z.literal("")]).optional(),
};

const emailSchema = z.object({
	notificationName,
	type: z.literal("email"),
	address: z.email("Please enter a valid e-mail address"),
	...unusedMatrixFields,
});

const webhookSchema = z.object({
	notificationName,
	type: z.literal("webhook"),
	address: z.url({ message: "Please enter a valid Webhook URL" }),
	...unusedMatrixFields,
});

// No unusedMatrixFields spread, unlike its webhook-shaped siblings: develop declared this channel
// without them, and widening it here would let a credential be stored on a channel that has no field
// to reset it from.
const rocketChatSchema = z.object({
	notificationName,
	type: z.literal("rocket_chat"),
	address: z.url({ protocol: /^https?$/, message: "Please enter a valid Rocket.Chat webhook URL" }),
});

const slackSchema = z.object({
	notificationName,
	type: z.literal("slack"),
	address: z.url({ message: "Please enter a valid Webhook URL" }),
	...unusedMatrixFields,
});

const discordSchema = z.object({
	notificationName,
	type: z.literal("discord"),
	address: z.url({ message: "Please enter a valid Webhook URL" }),
	...unusedMatrixFields,
});

const pagerDutySchema = z.object({
	notificationName,
	type: z.literal("pager_duty"),
	address: z.string().min(1, "PagerDuty integration key is required"),
	...unusedMatrixFields,
});

const matrixSchema = z.object({
	notificationName,
	type: z.literal("matrix"),
	address: z.union([z.string(), z.literal("")]).optional(),
	homeserverUrl: z.url({ message: "Please enter a valid Homeserver URL" }),
	roomId: z.string().min(1, "Room ID is required"),
	accessToken: z.string().min(1, "Access Token is required"),
});

const teamsSchema = z.object({
	notificationName,
	type: z.literal("teams"),
	address: z.url({ message: "Please enter a valid Webhook URL" }),
});

const telegramSchema = z.object({
	notificationName,
	type: z.literal("telegram"),
	address: z.string().min(1, "Chat ID is required"),
	accessToken: z.string().min(1, "Bot token is required"),
});

const pushoverSchema = z.object({
	notificationName,
	type: z.literal("pushover"),
	address: z.string().min(1, "User key is required"),
	accessToken: z.string().min(1, "App token is required"),
});

const twilioSchema = z.object({
	notificationName,
	type: z.literal("twilio"),
	accountSid: z.string().min(1, "Account SID is required"),
	accessToken: z.string().min(1, "Auth token is required"),
	phone: z.string().min(1, "Recipient phone number is required"),
	twilioPhoneNumber: z.string().min(1, "Twilio phone number is required"),
});

const ntfySchema = z.object({
	notificationName,
	type: z.literal("ntfy"),
	address: z.url({ message: "Please enter a valid ntfy server URL" }),
	topic: z.string().min(1, "Topic is required"),
});

export const createNotificationBodyValidation = z.discriminatedUnion("type", [
	emailSchema,
	webhookSchema,
	rocketChatSchema,
	slackSchema,
	discordSchema,
	pagerDutySchema,
	matrixSchema,
	teamsSchema,
	telegramSchema,
	pushoverSchema,
	twilioSchema,
	ntfySchema,
]);

// Editing an existing channel may omit its stored credential, which means "keep the stored value".
// Derived from the create schemas so each channel stays declared once: only the credential becomes
// optional, so an empty string is still rejected and a required credential cannot be blanked out.
export const editNotificationBodyValidation = z.discriminatedUnion("type", [
	emailSchema,
	webhookSchema,
	rocketChatSchema,
	slackSchema,
	discordSchema,
	pagerDutySchema,
	matrixSchema.partial({ accessToken: true }),
	teamsSchema,
	telegramSchema.partial({ accessToken: true }),
	pushoverSchema.partial({ accessToken: true }),
	twilioSchema.partial({ accessToken: true }),
	ntfySchema,
]);

// Build-time drift detection, mirroring NotificationFieldsAreClassified in notification.type.ts: a
// channel added to the create union must also reach the edit union. Missing it leaves that channel
// impossible to edit, and a discriminated union reports the cause only as "Invalid input" on the
// type field, which is a hard failure to trace back to this list.
type Assert<T extends true> = T;
type ChannelMissingFromEditUnion = Exclude<
	z.infer<typeof createNotificationBodyValidation>["type"],
	z.infer<typeof editNotificationBodyValidation>["type"]
>;
export type EditUnionCoversEveryChannel = Assert<
	[ChannelMissingFromEditUnion] extends [never] ? true : { addToEditNotificationBodyValidation: ChannelMissingFromEditUnion }
>;

// Testing an unsaved channel carries every credential in the body, so it stays strict.
export const testNotificationBodyValidation = createNotificationBodyValidation;

// Testing a saved channel may omit credentials; the server fills them in from the stored record.
export const testSavedNotificationBodyValidation = editNotificationBodyValidation;

export const deleteNotificationParamValidation = z.object({
	id: z.string().min(1, "Notification ID is required"),
});
export const getNotificationByIdParamValidation = z.object({
	id: z.string().min(1, "Notification ID is required"),
});
export const editNotificationParamValidation = z.object({
	id: z.string().min(1, "Notification ID is required"),
});
export const testSavedNotificationParamValidation = z.object({
	id: z.string().min(1, "Notification ID is required"),
});

// Canonical notification shape returned by /notifications endpoints. Credentials are absent by
// design: each one is reported as a boolean "<field>Set" so a client can tell that a value is
// stored without receiving it.
export const notificationResponseSchema = z.object({
	id: z.string(),
	userId: z.string(),
	teamId: z.string(),
	type: z.enum(NotificationChannels),
	notificationName: z.string(),
	address: z.string().optional(),
	phone: z.string().optional(),
	homeserverUrl: z.string().optional(),
	roomId: z.string().optional(),
	accountSid: z.string().optional(),
	twilioPhoneNumber: z.string().optional(),
	topic: z.string().optional(),
	createdAt: z.string(),
	updatedAt: z.string(),
	accessTokenSet: z.boolean(),
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
	systemEmailDisplayName: z.string().optional(),
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
