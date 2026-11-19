const SERVICE_NAME = "TelegramProvider";
import type { Notification } from "@/domain/notifications/notification.type.js";
import { NotificationProvider } from "@/domain/notifications/providers/INotificationProvider.js";
import type { NotificationMessage } from "@/domain/notifications/notification.type.js";
import { getTestMessage, incidentUrl } from "@/domain/notifications/providers/utils.js";
import got, { HTTPError } from "got";

// Telegram rejects messages longer than 4096 characters.
const TELEGRAM_MAX_MESSAGE_LENGTH = 4096;
// Cap on any single dynamic value (e.g. a check error holding a whole HTML error page) before escaping.
const MAX_FIELD_LENGTH = 500;

export class TelegramProvider extends NotificationProvider {
	protected readonly serviceName = SERVICE_NAME;

	async sendTestAlert(notification: Partial<Notification>): Promise<boolean> {
		if (!notification.address || !notification.accessToken) {
			return false;
		}

		try {
			await got.post(`https://api.telegram.org/bot${notification.accessToken}/sendMessage`, {
				json: {
					chat_id: notification.address,
					text: getTestMessage(),
					parse_mode: "HTML",
				},
				...this.gotRequestOptions(),
			});
			return true;
		} catch (error) {
			this.logger.warn({ err: error, ...this.telegramErrorDetails(error) }, "Telegram test alert failed");
			return false;
		}
	}

	async sendMessage(notification: Notification, message: NotificationMessage): Promise<boolean> {
		if (!notification.address || !notification.accessToken) {
			return false;
		}

		const text = this.buildTelegramText(message);

		try {
			await got.post(`https://api.telegram.org/bot${notification.accessToken}/sendMessage`, {
				json: {
					chat_id: notification.address,
					text,
					parse_mode: "HTML",
				},
				...this.gotRequestOptions(),
			});

			this.logger.info("Telegram notification sent");
			return true;
		} catch (error) {
			this.logger.warn({ err: error, ...this.telegramErrorDetails(error) }, "Telegram alert failed");
			return false;
		}
	}

	// Surface Telegram's own reason (e.g. "can't parse entities") instead of only the HTTP status.
	private telegramErrorDetails(error: unknown): { telegramDescription?: string } {
		if (!(error instanceof HTTPError)) return {};
		const body = error.response?.body;
		try {
			const parsed = typeof body === "string" ? JSON.parse(body) : body;
			if (parsed && typeof parsed.description === "string") return { telegramDescription: parsed.description };
		} catch {
			// body was not JSON
		}
		return typeof body === "string" ? { telegramDescription: body.slice(0, MAX_FIELD_LENGTH) } : {};
	}

	// Escape a dynamic value for Telegram's HTML parse mode. Truncate first so we never cut an entity in half.
	private esc(value: unknown): string {
		let text = value === undefined || value === null ? "" : String(value);
		if (text.length > MAX_FIELD_LENGTH) {
			text = `${text.slice(0, MAX_FIELD_LENGTH)}…`;
		}
		return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
	}

	private buildTelegramText(message: NotificationMessage): string {
		const lines: string[] = [];

		lines.push(`<b>${this.esc(message.content.title)}</b>`);
		lines.push(this.esc(message.content.summary));
		lines.push("");

		lines.push("<b>Monitor Details:</b>");
		lines.push(`• Name: ${this.esc(message.monitor.name)}`);
		lines.push(`• URL: ${this.esc(message.monitor.url)}`);
		lines.push(`• Type: ${this.esc(message.monitor.type)}`);
		lines.push(`• Status: ${this.esc(message.monitor.status)}`);

		if (message.content.details && message.content.details.length > 0) {
			lines.push("");
			lines.push("<b>Additional Information:</b>");
			message.content.details.forEach((detail) => lines.push(`• ${this.esc(detail)}`));
		}

		if (message.content.thresholds && message.content.thresholds.length > 0) {
			lines.push("");
			lines.push("<b>Threshold Breaches:</b>");
			message.content.thresholds.forEach((breach) => {
				lines.push(
					`• ${this.esc(breach.metric.toUpperCase())}: ${this.esc(breach.formattedValue)} (threshold: ${this.esc(breach.threshold)}${this.esc(breach.unit)})`
				);
			});
		}

		// The incident link is placed last so that, if the body still exceeds Telegram's limit, it is kept.
		const footer = message.content.incident ? `\n\n<a href="${this.esc(incidentUrl(message))}">View Incident</a>` : "";

		let body = lines.join("\n");
		const maxBody = TELEGRAM_MAX_MESSAGE_LENGTH - footer.length;
		if (body.length > maxBody) {
			// Cut on a line boundary so no tag or entity is split.
			body = body.slice(0, maxBody - 1);
			const lastNewline = body.lastIndexOf("\n");
			body = `${lastNewline > 0 ? body.slice(0, lastNewline) : ""}\n…`;
		}

		return body + footer;
	}
}
