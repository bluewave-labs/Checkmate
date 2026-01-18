import type { HardwareStatusPayload, Monitor, MonitorStatusResponse } from "@/types/index.js";
export interface INotificationsService {
	handleNotifications: (
		monitor: Monitor,
		monitorStatusResponse: MonitorStatusResponse,
		prevStatus: boolean | undefined,
		statusChanged: boolean
	) => Promise<boolean>;
}

export class NotificationsService implements INotificationsService {
	handleNotifications = async (
		monitor: Monitor,
		monitorStatusResponse: MonitorStatusResponse,
		prevStatus: boolean | undefined,
		statusChanged: boolean
	) => {
		const { type } = monitor;
		const payload = monitorStatusResponse.payload as HardwareStatusPayload;
		// If this is a non-hardeware type monitor and status did not change, we're done
		if (type !== "hardware" && statusChanged === false) return false;
		// if prevStatus is undefined, monitor is resuming, we're done
		if (type !== "hardware" && prevStatus === undefined) return false;

		// Deal with hardware thresholds
		if (type === "hardware") {
			const thresholds = monitor.thresholds;

			if (thresholds === undefined) return false; // No thresholds set, we're done
			const metrics = payload?.data ?? null;
			if (metrics === null) return false; // No metrics, we're done

			// We shoul dsend a notificaiton

			console.log(JSON.stringify(monitor, null, 2));
			console.log(JSON.stringify(monitorStatusResponse, null, 2));
			// const [alerts, discordContent] = await this.notificationUtils.buildHardwareAlerts(networkResponse);
			// if (alerts.length === 0) return false;

			// const { subject, html } = await this.notificationUtils.buildHardwareEmail(networkResponse, alerts);
			// const content = await this.notificationUtils.buildHardwareNotificationMessage(alerts, monitor);
			// const webhookBody = await this.notificationUtils.buildHardwareWebhookBody(alerts, monitor);
			// const success = await this.notifyAll({ notificationIDs, subject, html, content, discordContent, webhookBody });
			return true;
		}

		return false;
	};
}
