const SERVICE_NAME = "EmailProvider";
import type { Monitor, Notification, MonitorStatusResponse } from "@/types/index.js";
import { INotificationProvider } from "@/service/index.js";
import type { MonitorActionDecision } from "@/service/infrastructure/SuperSimpleQueue/SuperSimpleQueueHelper.js";
import { buildHardwareAlerts, buildHardwareEmail, buildEmail, buildTestEmail } from "@/service/infrastructure/notificationProviders/utils.js";

export class EmailProvider implements INotificationProvider {
	private emailService: any;
	private logger: any;

	constructor(emailService: any, logger: any) {
		this.emailService = emailService;
		this.logger = logger;
	}

	private buildHardwareEmail = async (monitor: Monitor, monitorStatusResponse: MonitorStatusResponse, decision: MonitorActionDecision) => {
		// For status changes (recovery), use standard email format
		if (decision.notificationReason === "status_change") {
			return await buildEmail(this.emailService, monitor);
		}
		// For threshold breaches, use hardware alert format
		const { alertsToSend } = buildHardwareAlerts("HOST_PLACEHOLDER", monitor, monitorStatusResponse);
		const html = buildHardwareEmail(this.emailService, monitor, alertsToSend);
		return html;
	};

	async sendAlert(
		notification: Notification,
		monitor: Monitor,
		monitorStatusResponse: MonitorStatusResponse,
		decision: MonitorActionDecision
	): Promise<boolean> {
		// For grouped notifications (identified by ":" in name), customize subject to indicate multiple services.
		// Example: "2 services: Service A, Service B" becomes "Alert: 2 services are down"
		const isGroupedNotification = monitor.name.includes(":");

		// Build subject based on notification reason and monitor status
		let subject: string;
		if (isGroupedNotification) {
			subject = `Alert: ${monitor.name} are down`;
		} else if (decision.notificationReason === "threshold_breach") {
			subject = `Monitor ${monitor.name} threshold breached`;
		} else if (monitor.status === "up") {
			subject = `Monitor ${monitor.name} is back up`;
		} else {
			subject = `Monitor ${monitor.name} is down`;
		}

		let html;
		if (monitor.type === "hardware") {
			html = await this.buildHardwareEmail(monitor, monitorStatusResponse, decision);
		} else {
			html = await buildEmail(this.emailService, monitor);
		}

		if (!notification.address) {
			return false;
		}

		const messageId = await this.emailService.sendEmail(notification.address, subject, html);
		if (!messageId) {
			this.logger.warn({
				message: "Email alert failed",
				service: SERVICE_NAME,
				method: "sendAlert",
			});
			return false;
		}
		return true;
	}

	async sendTestAlert(notification: Notification): Promise<boolean> {
		const subject = "Test notification";
		const html = await buildTestEmail(this.emailService);

		const messageId = await this.emailService.sendEmail(notification.address, subject, html);
		if (!messageId) {
			this.logger.warn({
				message: "Email test alert failed",
				service: SERVICE_NAME,
				method: "sendTestAlert",
			});
			return false;
		}
		return true;
	}
}
