const SERVICE_NAME = "MatrixProvider";
import got from "got";
import { NotificationProvider } from "@/domain/notifications/providers/INotificationProvider.js";
import type { AlertMatrixPayload, Notification } from "@/domain/notifications/notification.type.js";
import type { NotificationMessage } from "@/domain/notifications/notification.type.js";
import { getTestMessage } from "@/domain/notifications/providers/utils.js";
import { randomUUID } from "crypto";

export class MatrixProvider extends NotificationProvider {
	sendTestAlert = async (notification: Partial<Notification>) => {
		const { homeserverUrl, accessToken, roomId } = notification;
		if (!homeserverUrl || !accessToken || !roomId) {
			return false;
		}

		const body = {
			msgtype: "m.text",
			body: getTestMessage(),
		};
		return await this.sendMessageWithBody(notification, body);
	};

	sendMessage = async (notification: Notification, message: NotificationMessage): Promise<boolean> => {
		const { homeserverUrl, accessToken, roomId } = notification;
		if (!homeserverUrl || !accessToken || !roomId) {
			return false;
		}

		const { plainText, htmlText } = this.buildMatrixMessage(message);
		const body = {
			msgtype: "m.text",
			body: plainText,
			format: "org.matrix.custom.html",
			formatted_body: htmlText,
		};
		return this.sendMessageWithBody(notification, body);
	};

	private sendMessageWithBody = async (notification: Partial<Notification>, body: unknown): Promise<boolean> => {
		const { homeserverUrl, accessToken, roomId } = notification;
		const baseUrl = this.normalizeHomeserverUrl(homeserverUrl as string);

		try {
			const resolvedRoomId = await this.resolveRoomId(baseUrl, accessToken as string, roomId as string);
			const txnId = randomUUID();
			const url = `${baseUrl}/_matrix/client/v3/rooms/${encodeURIComponent(resolvedRoomId)}/send/m.room.message/${txnId}`;

			await got.put(url, {
				json: body,
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
				...this.gotRequestOptions(),
			});
			return true;
		} catch (error) {
			const err = error as Error;
			this.logger.warn({
				message: `Matrix notification failed : ${err.message}`,
				service: SERVICE_NAME,
				method: "sendMessage",
				stack: err.stack,
			});
			return false;
		}
	};

	private normalizeHomeserverUrl(homeserverUrl: string): string {
		return homeserverUrl.replace(/\/+$/, "");
	}

	/**
	 * The send endpoint only accepts a room ID (`!id:server`). Element shows users the room
	 * alias (`#name:server`) instead, and an unresolved alias breaks the request outright:
	 * the `#` opens a URI fragment, so the PUT lands on /rooms/ rather than the send
	 * endpoint. Resolve aliases through the directory first, per the client-server spec.
	 */
	private resolveRoomId = async (baseUrl: string, accessToken: string, roomIdOrAlias: string): Promise<string> => {
		if (!roomIdOrAlias.startsWith("#")) {
			return roomIdOrAlias;
		}

		const url = `${baseUrl}/_matrix/client/v3/directory/room/${encodeURIComponent(roomIdOrAlias)}`;
		const response = await got.get(url, {
			headers: { Authorization: `Bearer ${accessToken}` },
			responseType: "json",
			...this.gotRequestOptions(),
		});

		const roomId = (response.body as { room_id?: string })?.room_id;
		if (!roomId) {
			throw new Error(`Matrix directory returned no room_id for alias ${roomIdOrAlias}`);
		}
		return roomId;
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
