export const NotificationChannels = ["email", "slack", "discord", "webhook", "pager_duty", "matrix", "teams", "telegram", "pushover"] as const;
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
	createdAt: string;
	updatedAt: string;
}
