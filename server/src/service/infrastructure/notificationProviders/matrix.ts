const SERVICE_NAME = "MatrixProvider";
import got from "got";
import type { INotificationProvider } from "@/service/index.js";
import type { AlertMatrixPayload, Notification } from "@/types/index.js";
import type { NotificationMessage } from "@/types/notificationMessage.js";
import { getTestMessage } from "@/service/infrastructure/notificationProviders/utils.js";
import { ILogger } from "@/utils/logger.js";

export class MatrixProvider implements INotificationProvider {
	private logger: ILogger;

	constructor(logger: ILogger) {
		this.logger = logger;
	}

	sendTestAlert = async (notification: Partial<Notification>) => {
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
			await got.post(url, {
				json: body,
				headers: {
					"Content-Type": "application/json",
				},
			});
			return true;
		} catch (error) {
			const err = error as Error;
			this.logger.warn({
				message: "Matrix test alert failed",
				service: SERVICE_NAME,
				method: "sendTestAlert",
				stack: err?.stack,
			});
			return false;
		}
	};

	sendMessage = async (notification: Notification, message: NotificationMessage): Promise<boolean> => {
		const { homeserverUrl, accessToken, roomId } = notification;

		if (!homeserverUrl || !accessToken || !roomId) {
			return false;
		}

		const { plainText, htmlText } = this.buildMatrixMessage(message);

		const url = `${homeserverUrl}/_matrix/client/v3/rooms/${roomId}/send/m.room.message?access_token=${accessToken}`;
		const body = {
			msgtype: "m.text",
			body: plainText,
			format: "org.matrix.custom.html",
			formatted_body: htmlText,
		};

		try {
			await got.post(url, {
				json: body,
				headers: {
					"Content-Type": "application/json",
				},
			});
			return true;
		} catch (error) {
			const err = error as Error;
			this.logger.warn({
				message: "Matrix notification failed",
				service: SERVICE_NAME,
				method: "sendMessage",
				stack: err?.stack,
			});
			return false;
		}
	};

	/**
	 * Build Matrix message from NotificationMessage
	 * Returns both plain text and HTML formatted versions
	 * Matrix supports HTML subset for rich formatting
	 */
	private buildMatrixMessage(message: NotificationMessage): AlertMatrixPayload {
		const plainLines: string[] = [];
		const htmlLines: string[] = [];

		// Determine color based on severity
		const colorMap = {
			critical: "#FF0000", // Red
			warning: "#FFA500", // Orange
			success: "#00FF00", // Green
			info: "#0000FF", // Blue
		};
		const color = colorMap[message.severity] || "#808080";

		// Title
		plainLines.push(`# ${message.content.title}`);
		htmlLines.push(`<h2 style="color: ${color};">${this.escapeHtml(message.content.title)}</h2>`);

		// Summary
		plainLines.push("");
		plainLines.push(message.content.summary);
		htmlLines.push(`<p>${this.escapeHtml(message.content.summary)}</p>`);

		// Monitor details
		plainLines.push("");
		plainLines.push("## Monitor Details");
		plainLines.push(`- Name: ${message.monitor.name}`);
		plainLines.push(`- URL: ${message.monitor.url}`);
		plainLines.push(`- Type: ${message.monitor.type}`);
		plainLines.push(`- Status: ${message.monitor.status}`);

		htmlLines.push(`<h3>Monitor Details</h3>`);
		htmlLines.push(`<ul>`);
		htmlLines.push(`<li><strong>Name:</strong> ${this.escapeHtml(message.monitor.name)}</li>`);
		htmlLines.push(`<li><strong>URL:</strong> <a href="${this.escapeHtml(message.monitor.url)}">${this.escapeHtml(message.monitor.url)}</a></li>`);
		htmlLines.push(`<li><strong>Type:</strong> ${this.escapeHtml(message.monitor.type)}</li>`);
		htmlLines.push(`<li><strong>Status:</strong> ${this.escapeHtml(message.monitor.status)}</li>`);
		htmlLines.push(`</ul>`);

		// Threshold breaches (if any)
		if (message.content.thresholds && message.content.thresholds.length > 0) {
			plainLines.push("");
			plainLines.push("## Threshold Breaches");
			htmlLines.push(`<h3>Threshold Breaches</h3>`);
			htmlLines.push(`<ul>`);

			message.content.thresholds.forEach((breach) => {
				plainLines.push(`- ${breach.metric.toUpperCase()}: ${breach.formattedValue} (threshold: ${breach.threshold}${breach.unit})`);
				htmlLines.push(
					`<li><strong>${this.escapeHtml(breach.metric.toUpperCase())}:</strong> ${this.escapeHtml(breach.formattedValue)} (threshold: ${breach.threshold}${this.escapeHtml(breach.unit)})</li>`
				);
			});

			htmlLines.push(`</ul>`);
		}

		// Additional details (if any)
		if (message.content.details && message.content.details.length > 0) {
			plainLines.push("");
			plainLines.push("## Additional Information");
			htmlLines.push(`<h3>Additional Information</h3>`);
			htmlLines.push(`<ul>`);

			message.content.details.forEach((detail) => {
				plainLines.push(`- ${detail}`);
				htmlLines.push(`<li>${this.escapeHtml(detail)}</li>`);
			});

			htmlLines.push(`</ul>`);
		}

		// Incident link (if incident exists)
		if (message.content.incident) {
			const incidentUrl = `${message.clientHost}/infrastructure/${message.monitor.id}`;
			plainLines.push("");
			plainLines.push(`View Incident: ${incidentUrl}`);
			htmlLines.push(`<p><a href="${this.escapeHtml(incidentUrl)}">View Incident</a></p>`);
		}

		// Footer with timestamp
		plainLines.push("");
		plainLines.push(`Checkmate | ${new Date(message.content.timestamp).toUTCString()}`);
		htmlLines.push(`<hr>`);
		htmlLines.push(`<p><small>Checkmate | ${new Date(message.content.timestamp).toUTCString()}</small></p>`);

		return {
			plainText: plainLines.join("\n"),
			htmlText: htmlLines.join(""),
		};
	}

	/**
	 * Escape HTML special characters for safe rendering
	 */
	private escapeHtml(text: string): string {
		return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
	}
}
