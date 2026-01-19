import got from "got";
import type { INotificationProvider } from "@/service/index.js";
import type { Notification, Monitor, MonitorStatusResponse } from "@/types/index.js";
import {
	buildHardwareAlerts,
	buildHardwareWebhookBody,
	buildWebhookBody,
	getTestMessage,
} from "@/service/infrastructure/notificationProviders/utils.js";

export class MatrixProvider implements INotificationProvider {
	constructor(private logger: any) {}
	private getHardwareContent = (monitor: Monitor, monitorStatusResponse: MonitorStatusResponse) => {
		const { alertsToSend } = buildHardwareAlerts("HOST_PLACEHOLDER", monitor, monitorStatusResponse);
		const body = buildHardwareWebhookBody(alertsToSend, monitor);
		return body;
	};

	private getContent = (monitor: Monitor, monitorStatusResponse: MonitorStatusResponse) => {
		const body = buildWebhookBody(monitor, monitorStatusResponse);
		return body;
	};

	sendAlert = async (notification: Notification, monitor: Monitor, monitorStatusResponse: MonitorStatusResponse) => {
		const { homeserverUrl, accessToken, roomId } = notification;

		let content;
		if (monitor.type === "hardware") {
			content = this.getHardwareContent(monitor, monitorStatusResponse);
		} else {
			content = this.getContent(monitor, monitorStatusResponse);
		}

		const title = `Checkmate status for ${monitor.name}`;

		const formattedMessage = `## ${title}\n${content}`;

		const url = `${homeserverUrl}/_matrix/client/v3/rooms/${roomId}/send/m.room.message?access_token=${accessToken}`;
		const body = {
			msgtype: "m.text",
			body: formattedMessage,
			format: "org.matrix.custom.html",
			formatted_body: formattedMessage,
		};
		try {
			this.logger?.debug?.("Sending Matrix alert", { room: roomId });
			await got.post(url, {
				json: body,
				headers: {
					"Content-Type": "application/json",
				},
				responseType: "json",
			});
			return true;
		} catch (error) {
			this.logger?.error?.("Matrix alert failed", { error });
			return false;
		}
	};

	sendTestAlert = async (notification: Notification) => {
		const { homeserverUrl, accessToken, roomId } = notification;
		if (!homeserverUrl || !accessToken || !roomId) {
			return false;
		}
		const url = `${homeserverUrl}/_matrix/client/v3/rooms/${roomId}/send/m.room.message?access_token=${accessToken}`;
		const body = {
			msgtype: "m.text",
			body: getTestMessage(),
		};
		try {
			this.logger?.debug?.("Sending Matrix test alert", { room: roomId });
			await got.post(url, {
				json: body,
				headers: {
					"Content-Type": "application/json",
				},
				responseType: "json",
			});
			return true;
		} catch (error) {
			this.logger?.error?.("Matrix test alert failed", { error });
			return false;
		}
	};
}
