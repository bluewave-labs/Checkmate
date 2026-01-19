import type { Monitor, Notification, MonitorStatusResponse } from "@/types/index.js";
import { INotificationProvider } from "@/service/index.js";
import { buildHardwareAlerts, buildHardwareEmail, buildEmail } from "@/service/infrastructure/notificationProviders/utils.js";

export class EmailProvider implements INotificationProvider {
	private emailService: any;
	constructor(emailService: any) {
		this.emailService = emailService;
	}

	private buildHardwareEmail = (monitor: Monitor, monitorStatusResponse: MonitorStatusResponse) => {
		const { alertsToSend } = buildHardwareAlerts("HOST_PLACEHOLDER", monitor, monitorStatusResponse);
		const html = buildHardwareEmail(this.emailService, monitor, alertsToSend);
		return html;
	};

	async sendAlert(notification: Notification, monitor: Monitor, monitorStatusResponse: MonitorStatusResponse): Promise<boolean> {
		const subject = `Monitor ${monitor.name} infrastructure alerts`;
		let html;
		if (monitor.type === "hardware") {
			html = this.buildHardwareEmail(monitor, monitorStatusResponse);
		} else {
			html = await buildEmail(this.emailService, monitor);
		}

		if (!notification.address) {
			return false;
		}

		const messageId = await this.emailService.sendEmail(notification.address, subject, html);
		if (!messageId) return false;
		return true;
	}

	async sendTestAlert(notification: Notification): Promise<boolean> {
		return false;
	}
}
