const SERVICE_NAME = "AppriseProvider";
import type { Notification } from "@/domain/notifications/notification.type.js";
import { NotificationProvider } from "@/domain/notifications/providers/INotificationProvider.js";
import type { NotificationMessage } from "@/domain/notifications/notification.type.js";
import { getTestMessage } from "@/domain/notifications/providers/utils.js";
import got from "got";

type AppriseType = "info" | "success" | "warning" | "failure";

interface AppriseTarget {
	url: string;
	urls?: string;
}

/**
 * Sends through an Apprise API server (https://github.com/caronc/apprise-api).
 * `address` is the server URL. A configuration key stored in `topic` posts to
 * /notify/{key}; otherwise the Apprise URLs in `appriseUrls` are posted to /notify.
 */
export class AppriseProvider extends NotificationProvider {
	async sendTestAlert(notification: Partial<Notification>): Promise<boolean> {
		const target = this.resolveTarget(notification, "sendTestAlert");
		if (!target) {
			return false;
		}

		try {
			await got.post(target.url, {
				json: this.buildPayload(target, "Checkmate test notification", getTestMessage(), "info"),
				...this.gotRequestOptions(),
			});
			return true;
		} catch (error) {
			const err = error as Error;
			this.logger.warn({
				message: "Apprise test alert failed",
				service: SERVICE_NAME,
				method: "sendTestAlert",
				stack: err?.stack,
			});
			return false;
		}
	}

	async sendMessage(notification: Notification, message: NotificationMessage): Promise<boolean> {
		const target = this.resolveTarget(notification, "sendMessage");
		if (!target) {
			return false;
		}

		try {
			await got.post(target.url, {
				json: this.buildPayload(target, message.content.title, this.buildText(message), this.mapType(message.severity)),
				...this.gotRequestOptions(),
			});
			this.logger.info({
				message: "Apprise notification sent",
				service: SERVICE_NAME,
				method: "sendMessage",
			});
			return true;
		} catch (error) {
			const err = error as Error;
			this.logger.warn({
				message: "Apprise alert failed",
				service: SERVICE_NAME,
				method: "sendMessage",
				stack: err?.stack,
			});
			return false;
		}
	}

	private resolveTarget(notification: Partial<Notification>, method: string): AppriseTarget | null {
		const base = notification.address?.trim().replace(/\/+$/, "");
		if (!base) {
			return null;
		}

		const key = notification.topic?.trim();
		if (key) {
			return { url: `${base}/notify/${encodeURIComponent(key)}` };
		}

		const urls = notification.appriseUrls?.trim();
		if (urls) {
			return { url: `${base}/notify`, urls };
		}

		this.logger.warn({
			message: "Apprise notification needs a configuration key or at least one Apprise URL",
			service: SERVICE_NAME,
			method,
		});
		return null;
	}

	private buildPayload(target: AppriseTarget, title: string, body: string, type: AppriseType): Record<string, string> {
		const payload: Record<string, string> = { title, body, type, format: "text" };
		if (target.urls) {
			payload.urls = target.urls;
		}
		return payload;
	}

	private buildText(message: NotificationMessage): string {
		const lines = [
			message.content.summary,
			"",
			"Monitor Details:",
			`- Name: ${message.monitor.name}`,
			`- URL: ${message.monitor.url}`,
			`- Type: ${message.monitor.type}`,
			`- Status: ${message.monitor.status}`,
		];

		if (message.content.details && message.content.details.length > 0) {
			lines.push("", "Additional Information:");
			message.content.details.forEach((detail) => lines.push(`- ${detail}`));
		}

		if (message.content.thresholds && message.content.thresholds.length > 0) {
			lines.push("", "Threshold Breaches:");
			message.content.thresholds.forEach((breach) => {
				lines.push(`- ${breach.metric.toUpperCase()}: ${breach.formattedValue} (threshold: ${breach.threshold}${breach.unit})`);
			});
		}

		if (message.content.incident) {
			lines.push("", `${message.clientHost}/infrastructure/${message.monitor.id}`);
		}

		return lines.join("\n");
	}

	private mapType(severity: NotificationMessage["severity"]): AppriseType {
		switch (severity) {
			case "critical":
				return "failure";
			case "warning":
				return "warning";
			case "success":
				return "success";
			default:
				return "info";
		}
	}
}
