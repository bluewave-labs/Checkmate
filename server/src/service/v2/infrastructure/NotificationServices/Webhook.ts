import { IMonitor, INotificationChannel } from "../../../../db/v2/models/index.js";
import { IAlert, IMessageService } from "./IMessageService.js";
import ApiError from "../../../../utils/ApiError.js";
import got from "got";
class WebhookService implements IMessageService {
	constructor() {}

	buildAlert = (monitor: IMonitor) => {
		const name = monitor?.name || "Unnamed monitor";
		const monitorStatus = monitor?.status || "unknown status";
		const url = monitor?.url || "no URL";
		const checkTime = monitor?.lastCheckedAt || null;
		const alertTime = new Date();
		return {
			name,
			url,
			status: monitorStatus,
			checkTime,
			alertTime,
		};
	};

	sendMessage = async (alert: IAlert, channel: INotificationChannel) => {
		const notificationUrl = channel?.config?.url;
		if (!notificationUrl) {
			throw new ApiError("Webhook URL not configured", 400);
		}
		try {
			await got.post(notificationUrl, { json: { ...alert } });
		} catch (error) {
			console.warn("Failed to send webhook notification:", error);
			return false;
		}

		return true;
	};

	testMessage = async () => {
		return true;
	};
}

export default WebhookService;
