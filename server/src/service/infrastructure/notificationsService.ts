import type { Monitor, MonitorStatusResponse } from "@/types/index.js";
export interface INotificationsService {
	handleNotifications: (monitor: Monitor, monitorStatusResponse: MonitorStatusResponse) => Promise<void>;
}

export class NotificationsService implements INotificationsService {
	handleNotifications = async (monitor: Monitor, monitorStatusResponse: MonitorStatusResponse) => {
		console.log(JSON.stringify(monitor, null, 2));
		console.log(JSON.stringify(monitorStatusResponse, null, 2));
	};
}
