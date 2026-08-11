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
	webhookAuthType?: 'none' | 'basic' | 'bearer';
	webhookUsername?: string;
	webhookPassword?: string;
	webhookToken?: string;
	createdAt: string;
	updatedAt: string;
}
