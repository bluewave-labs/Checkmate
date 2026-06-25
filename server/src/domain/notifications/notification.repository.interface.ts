import type { Notification } from "@/domain/notifications/notification.type.js";
export interface INotificationsRepository {
	// create
	create(notificationData: Partial<Notification>): Promise<Notification>;
	// fetch
	findById(id: string, teamId: string): Promise<Notification>;
	findNotificationsByIds(ids: string[]): Promise<Notification[]>;
	findByTeamId(teamId: string): Promise<Notification[]>;
	// update
	updateById(id: string, teamId: string, updateData: Partial<Notification>): Promise<Notification>;
	// delete
	deleteById(id: string, teamId: string): Promise<Notification>;
}
