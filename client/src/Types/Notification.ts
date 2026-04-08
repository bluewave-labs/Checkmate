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
	"ntfy",
] as const;
export type NotificationChannel = (typeof NotificationChannels)[number];

export const AuthTypes = [
	"none",
	"basic",
	"bearer",
] as const;
export type AuthType = (typeof AuthTypes)[number];

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
	authType?: AuthType;
	username?: string;
	password?: string;
	accessToken?: string;
	createdAt: string;
	updatedAt: string;
}
