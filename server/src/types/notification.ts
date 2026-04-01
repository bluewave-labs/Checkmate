export const NotificationChannels = [
	"email",
	"slack",
	"discord",
	"webhook",
	"pager_duty",
	"matrix",
	"teams",
	"telegram",
	"pushover",
	"twilio",
] as const;
export type NotificationChannel = (typeof NotificationChannels)[number];

export const WebhookAuthTypes = ["none", "basic", "bearer"] as const;
export type WebhookAuthType = (typeof WebhookAuthTypes)[number];

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
	authType?: WebhookAuthType;
	authUsername?: string;
	authPassword?: string;
	authToken?: string;
	createdAt: string;
	updatedAt: string;
}
