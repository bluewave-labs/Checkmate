const SERVICE_NAME = "EmailProvider";
import type { Monitor, Notification, MonitorStatusResponse } from "@/types/index.js";
import { INotificationProvider } from "@/service/index.js";
import type { MonitorActionDecision } from "@/service/infrastructure/SuperSimpleQueue/SuperSimpleQueueHelper.js";
import { buildHardwareAlerts, buildHardwareEmail, buildEmail, buildTestEmail } from "@/service/infrastructure/notificationProviders/utils.js";
import type { NotificationMessage } from "@/types/notificationMessage.js";

export class EmailProvider implements INotificationProvider {
	private emailService: any;
	private logger: any;

	constructor(emailService: any, logger: any) {
		this.emailService = emailService;
		this.logger = logger;
	}

	private buildHardwareEmail = async (
		clientHost: string,
		monitor: Monitor,
		monitorStatusResponse: MonitorStatusResponse,
		decision: MonitorActionDecision
	) => {
		// For status changes (recovery), use standard email format
		if (decision.notificationReason === "status_change") {
			return await buildEmail(this.emailService, monitor);
		}
		// For threshold breaches, use hardware alert format
		const { alertsToSend } = buildHardwareAlerts(clientHost, monitor, monitorStatusResponse);
		const html = buildHardwareEmail(this.emailService, monitor, alertsToSend);
		return html;
	};

	async sendAlert(
		notification: Notification,
		monitor: Monitor,
		monitorStatusResponse: MonitorStatusResponse,
		decision: MonitorActionDecision,
		clientHost: string
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
			html = await this.buildHardwareEmail(clientHost, monitor, monitorStatusResponse, decision);
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

	async sendMessage(notification: Notification, message: NotificationMessage): Promise<boolean> {
		if (!notification.address) {
			return false;
		}

		const subject = this.buildSubject(message);
		const html = await this.buildEmailFromMessage(message);

		const messageId = await this.emailService.sendEmail(notification.address, subject, html);
		if (!messageId) {
			this.logger.warn({
				message: "Email notification failed via sendMessage",
				service: SERVICE_NAME,
				method: "sendMessage",
			});
			return false;
		}
		return true;
	}

	private buildSubject(message: NotificationMessage): string {
		switch (message.type) {
			case "monitor_down":
				return `Monitor ${message.monitor.name} is down`;
			case "monitor_up":
				return `Monitor ${message.monitor.name} is back up`;
			case "threshold_breach":
				return `Monitor ${message.monitor.name} threshold breached`;
			case "threshold_resolved":
				return `Monitor ${message.monitor.name} thresholds resolved`;
			default:
				return `Alert: ${message.monitor.name}`;
		}
	}

	private async buildEmailFromMessage(message: NotificationMessage): Promise<string> {
		const context = {
			title: message.content.title,
			summary: message.content.summary,
			monitorName: message.monitor.name,
			monitorUrl: message.monitor.url,
			monitorType: message.monitor.type,
			monitorStatus: message.monitor.status,
			headerColor: this.getColorForSeverity(message.severity),
			thresholds: message.content.thresholds,
			details: message.content.details,
			incidentUrl: message.content.incident?.url,
		};

		this.logger.info({
			message: "[DEBUG] Building email from message",
			service: SERVICE_NAME,
			method: "buildEmailFromMessage",
			details: { context },
		});

		return await this.emailService.buildEmail("unifiedNotificationTemplate", context);
		const html = await this.emailService.buildEmail("unifiedNotificationTemplate", context);

		this.logger.info({
			message: "[DEBUG] Email HTML generated",
			service: SERVICE_NAME,
			method: "buildEmailFromMessage",
			details: {
				htmlLength: html?.length || 0,
				htmlPreview: html?.substring(0, 200),
			},
		});

		return html;
	}

	private getColorForSeverity(severity: string): string {
		const colorMap: Record<string, string> = {
			critical: "red",
			warning: "#f59e0b",
			info: "#3b82f6",
			success: "green",
		};
		return colorMap[severity] ?? "#3b82f6";
	}
}
