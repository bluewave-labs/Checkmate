const SERVICE_NAME = "SignalgridProvider";
import type { Notification, NotificationMessage, NotificationSeverity } from "@/domain/notifications/notification.type.js";
import { NotificationProvider } from "@/domain/notifications/providers/INotificationProvider.js";
import { getTestMessage } from "@/domain/notifications/providers/utils.js";
import got from "got";

export class SignalgridProvider extends NotificationProvider {
	async sendTestAlert(notification: Partial<Notification>): Promise<boolean> {
		if (!notification.address || !notification.accessToken) {
			return false;
		}

		try {
			await got.post("https://api.signalgrid.co/v1/push", {
				form: {
					client_key: notification.accessToken,
					channel: notification.address,
					title: "Checkmate Test Notification",
					body: getTestMessage(),
					type: "INFO",
					critical: false,
				},
				...this.gotRequestOptions(),
			});
			return true;
		} catch (error) {
			const errMsg = error instanceof Error ? error.message : "unknown error";
			const errStack = error instanceof Error ? error.stack : undefined;
			this.logger.warn({
				message: "Signalgrid test alert failed",
				service: SERVICE_NAME,
				method: "sendTestAlert",
				stack: errStack,
				details: { error: errMsg },
			});
			return false;
		}
	}

	async sendMessage(notification: Notification, message: NotificationMessage): Promise<boolean> {
		if (!notification.address || !notification.accessToken) {
			return false;
		}

		try {
			await got.post("https://api.signalgrid.co/v1/push", {
				form: {
					client_key: notification.accessToken,
					channel: notification.address,
					title: message.content.title,
					body: this.buildSignalgridText(message),
					type: this.mapSeverity(message.severity),
					critical: false,
				},
				...this.gotRequestOptions(),
			});

			this.logger.info({
				message: "Signalgrid notification sent",
				service: SERVICE_NAME,
				method: "sendMessage",
			});
			return true;
		} catch (error) {
			const errMsg = error instanceof Error ? error.message : "unknown error";
			const errStack = error instanceof Error ? error.stack : undefined;
			this.logger.warn({
				message: "Signalgrid alert failed",
				service: SERVICE_NAME,
				method: "sendMessage",
				stack: errStack,
				details: { error: errMsg },
			});
			return false;
		}
	}

	private mapSeverity(severity: NotificationSeverity): "CRIT" | "WARN" | "INFO" | "SUCCESS" {
		switch (severity) {
			case "critical":
				return "CRIT";
			case "warning":
				return "WARN";
			case "success":
				return "SUCCESS";
			default:
				return "INFO";
		}
	}

	private buildSignalgridText(message: NotificationMessage): string {
		const lines: string[] = [];

		lines.push(message.content.summary);
		lines.push("");
		lines.push("Monitor Details:");
		lines.push(`• Name: ${message.monitor.name}`);
		lines.push(`• URL: ${message.monitor.url}`);
		lines.push(`• Type: ${message.monitor.type}`);
		lines.push(`• Status: ${message.monitor.status}`);

		if (message.content.details && message.content.details.length > 0) {
			lines.push("");
			lines.push("Additional Information:");
			message.content.details.forEach((detail) => lines.push(`• ${detail}`));
		}

		if (message.content.thresholds && message.content.thresholds.length > 0) {
			lines.push("");
			lines.push("Threshold Breaches:");
			message.content.thresholds.forEach((breach) => {
				lines.push(`• ${breach.metric.toUpperCase()}: ${breach.formattedValue} (threshold: ${breach.threshold}${breach.unit})`);
			});
		}

		if (message.content.incident) {
			lines.push("");
			lines.push(`View Incident: ${message.clientHost}/incidents/${message.monitor.id}`);
		}

		return lines.join("\n");
	}
}
