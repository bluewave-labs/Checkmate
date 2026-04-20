const SERVICE_NAME = "TwilioProvider";
import type { Notification } from "@/types/index.js";
import { NotificationProvider } from "@/service/infrastructure/notificationProviders/INotificationProvider.js";
import type { NotificationMessage } from "@/types/notificationMessage.js";
import { getTestMessage } from "@/service/infrastructure/notificationProviders/utils.js";
import got from "got";

export class TwilioProvider extends NotificationProvider {
	async sendTestAlert(notification: Partial<Notification>): Promise<boolean> {
		if (!notification.accountSid || !notification.accessToken || !notification.phone || !notification.twilioPhoneNumber) {
			return false;
		}

		try {
			await got.post(`https://api.twilio.com/2010-04-01/Accounts/${notification.accountSid}/Messages.json`, {
				form: {
					To: notification.phone,
					From: notification.twilioPhoneNumber,
					Body: getTestMessage(),
				},
				username: notification.accountSid,
				password: notification.accessToken,
				...this.gotRequestOptions(),
			});
			return true;
		} catch (error) {
			const errMsg = error instanceof Error ? error.message : "unknown error";
			const errStack = error instanceof Error ? error.stack : undefined;
			this.logger.warn({
				message: "Twilio test alert failed",
				service: SERVICE_NAME,
				method: "sendTestAlert",
				stack: errStack,
				details: { error: errMsg },
			});
			return false;
		}
	}

	async sendMessage(notification: Notification, message: NotificationMessage): Promise<boolean> {
		if (!notification.accountSid || !notification.accessToken || !notification.phone || !notification.twilioPhoneNumber) {
			return false;
		}

		const text = this.buildSmsText(message);

		try {
			await got.post(`https://api.twilio.com/2010-04-01/Accounts/${notification.accountSid}/Messages.json`, {
				form: {
					To: notification.phone,
					From: notification.twilioPhoneNumber,
					Body: text,
				},
				username: notification.accountSid,
				password: notification.accessToken,
				...this.gotRequestOptions(),
			});

			this.logger.info({
				message: "Twilio SMS notification sent",
				service: SERVICE_NAME,
				method: "sendMessage",
			});
			return true;
		} catch (error) {
			const errMsg = error instanceof Error ? error.message : "unknown error";
			const errStack = error instanceof Error ? error.stack : undefined;
			this.logger.warn({
				message: "Twilio SMS alert failed",
				service: SERVICE_NAME,
				method: "sendMessage",
				stack: errStack,
				details: { error: errMsg },
			});
			return false;
		}
	}

	private buildSmsText(message: NotificationMessage): string {
		const lines: string[] = [];

		lines.push(message.content.title);
		lines.push(message.content.summary);
		lines.push("");
		lines.push(`URL: ${message.monitor.url}`);
		lines.push(`Status: ${message.monitor.status}`);

		if (message.content.thresholds && message.content.thresholds.length > 0) {
			message.content.thresholds.forEach((breach) => {
				lines.push(`${breach.metric.toUpperCase()}: ${breach.formattedValue}`);
			});
		}

		return lines.join("\n");
	}
}
