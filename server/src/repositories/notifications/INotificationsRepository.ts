import type { Notification } from "@/types/index.js";
export interface INotificationsRepository {
	// create
	// fetch
	findNotificationsByIds(ids: string[]): Promise<Notification[]>;
	// update
	// delete
}
