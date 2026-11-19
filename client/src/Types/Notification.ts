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
	"signalgrid",
	"twilio",
	"ntfy",
] as const;
export type NotificationChannel = (typeof NotificationChannels)[number];

export const NtfyAuthTypes = ["none", "token", "basic"] as const;
export type NtfyAuthType = (typeof NtfyAuthTypes)[number];

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
	ntfyAuthType?: NtfyAuthType;
	ntfyUsername?: string;
	createdAt: string;
	updatedAt: string;
}
