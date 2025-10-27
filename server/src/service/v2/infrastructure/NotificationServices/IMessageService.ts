import { IMonitor, INotificationChannel } from "../../../../db/v2/models/index.js";

export interface IAlert {
	name: string;
	url: string;
	status: string;
	details?: Record<string, string>;
	checkTime: Date | null;
	alertTime: Date;
}
export interface IMessageService {
	buildAlert: (monitor: IMonitor) => IAlert;
	sendMessage: (alert: IAlert, channel: INotificationChannel) => Promise<boolean>;
	testMessage: (message: string, channel: INotificationChannel) => Promise<boolean>;
}
