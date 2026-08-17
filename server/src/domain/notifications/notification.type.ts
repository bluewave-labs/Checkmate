export const NotificationChannels = [
	"email",
	"slack",
	"discord",
	"webhook",
	"rocket_chat",
	"pager_duty",
	"matrix",
	"teams",
	"telegram",
	"pushover",
	"twilio",
	"ntfy",
] as const;
export type NotificationChannel = (typeof NotificationChannels)[number];

export interface Notification {
	id: string;
	userId: string;
	teamId: string;
	type: NotificationChannel;
	notificationName: string;
	address?: string;
	phone?: string;
	homeserverUrl?: string;
	roomId?: string;
	accessToken?: string;
	accountSid?: string;
	twilioPhoneNumber?: string;
	topic?: string;
	createdAt: string;
	updatedAt: string;
}

// Credentials. Stored and used to send, never returned to the client.
export const NotificationSecretFields = ["accessToken"] as const satisfies readonly (keyof Notification)[];
export type NotificationSecretField = (typeof NotificationSecretFields)[number];

// Fields the API may return. Listed explicitly rather than derived as "everything that is not a
// secret" so a newly added field stays invisible to clients until it is deliberately classified.
// accountSid is public on purpose: it is Twilio's Basic-auth username and travels in the request
// URL by design, so it identifies an account rather than authenticating one.
//
// address is public because it is the channel's destination and the form has always shown it, but
// for the webhook-shaped channels the URL is itself the authorization, and for pager_duty it is the
// routing key. Treating those as secret would change the API and the form for six channel types, so
// it is left as it was rather than settled here. This list is not a claim that every entry is
// harmless to expose; it is a claim that nothing reaches a client without being considered.
export const NotificationPublicFields = [
	"id",
	"userId",
	"teamId",
	"type",
	"notificationName",
	"address",
	"phone",
	"homeserverUrl",
	"roomId",
	"accountSid",
	"twilioPhoneNumber",
	"topic",
	"createdAt",
	"updatedAt",
] as const satisfies readonly Exclude<keyof Notification, NotificationSecretField>[];
export type NotificationPublicField = (typeof NotificationPublicFields)[number];

// Each secret is replaced in responses by a boolean telling the client whether one is stored,
// mirroring pagespeedKeySet / emailPasswordSet in settingsController.
export type NotificationSecretFlag = `${NotificationSecretField}Set`;

// The notification shape returned by the API. Every public field is a required key, so a response
// cannot silently drop one; an optional field keeps its own optional value type.
export type PublicNotification = { [K in NotificationPublicField]-?: Notification[K] } & Record<NotificationSecretFlag, boolean>;

// Which stored secrets a channel's provider actually authenticates with. A secret stored against a
// channel that does not use one is inert: it never reaches a request, so it must not restrict edits
// to that channel either. Such records exist, because switching a channel's type used to leave the
// previous provider's credential in the document.
export const NotificationCredentialFields = {
	email: [], // delivered by the configured SMTP server, which carries its own credentials
	slack: [], // the webhook URL is the whole authorization
	discord: [],
	webhook: [],
	rocket_chat: [],
	pager_duty: [], // the routing key travels in the payload, not as a credential
	matrix: ["accessToken"],
	teams: [],
	telegram: ["accessToken"],
	pushover: ["accessToken"],
	twilio: ["accessToken"],
	ntfy: [], // until ntfy auth lands, see #3717
} as const satisfies Record<NotificationChannel, readonly NotificationSecretField[]>;

// Fields that decide which HOST a notification is delivered to, and therefore where a stored
// credential would travel. Channels whose provider posts to a fixed host have no such field: their
// credential can only ever reach that provider's own API. Exhaustive over NotificationChannel so a
// new channel has to make this decision rather than inherit an unguarded default.
//
// Host, not recipient: a fixed-host channel's credential can still be repointed at another chat id,
// user key or phone number without being re-entered. That discloses future alerts to whoever owns
// the new recipient, but never the credential itself, which is why those entries stay empty.
export const NotificationDestinationFields = {
	email: [], // delivered by the configured SMTP server, not by the address
	slack: ["address"],
	discord: ["address"],
	webhook: ["address"],
	rocket_chat: ["address"],
	pager_duty: [], // fixed host: events.pagerduty.com
	matrix: ["homeserverUrl"],
	teams: ["address"],
	telegram: [], // fixed host: api.telegram.org
	pushover: [], // fixed host: api.pushover.net
	twilio: [], // fixed host: api.twilio.com
	ntfy: ["address"],
} as const satisfies Record<NotificationChannel, readonly (keyof Notification)[]>;

// Build-time drift detection: every field of Notification must be classified above. Adding one
// without classifying it fails the build, the same way openapi/routes/notification.ts fails when a
// notification variant has no metadata entry.
type Assert<T extends true> = T;
type UnclassifiedNotificationField = Exclude<keyof Notification, NotificationPublicField | NotificationSecretField>;
export type NotificationFieldsAreClassified = Assert<
	[UnclassifiedNotificationField] extends [never] ? true : { classifyAsPublicOrSecret: UnclassifiedNotificationField }
>;

export interface AlertPagerDutyPayload {
	routing_key?: string;
	dedup_key?: string;
	event_action?: "trigger" | "resolve";
	payload: Record<string, unknown>;
}

export interface AlertMatrixPayload {
	plainText: string;
	htmlText: string;
}

export interface DiscordEmbedField {
	name: string;
	value: string;
	inline?: boolean;
}

export interface AlertDiscordPayload {
	title: string;
	description: string;
	color: number;
	fields: DiscordEmbedField[];
	timestamp: string;
}

/**
 * Unified notification message types for cross-provider consistency
 * Part of notification system unification effort
 */

export type NotificationType = "monitor_down" | "monitor_up" | "threshold_breach" | "threshold_resolved" | "test";

export type NotificationSeverity = "critical" | "warning" | "info" | "success";

export interface MonitorInfo {
	id: string;
	name: string;
	url: string;
	type: string;
	status: string;
}

export interface ThresholdBreach {
	metric: "cpu" | "memory" | "disk" | "temp";
	currentValue: number;
	threshold: number;
	unit: string;
	formattedValue: string; // e.g., "85%" or "72°C"
}

export interface IncidentInfo {
	id: string;
	url: string;
	createdAt: Date;
	resolvedAt?: Date;
	duration?: string;
}

export interface NotificationContent {
	title: string;
	summary: string;
	details?: string[];
	thresholds?: ThresholdBreach[];
	incident?: IncidentInfo;
	timestamp: Date;
}

export interface NotificationMessage {
	type: NotificationType;
	severity: NotificationSeverity;
	monitor: MonitorInfo;
	content: NotificationContent;
	clientHost: string;
	metadata: {
		teamId: string;
		notificationReason: string;
	};
}
