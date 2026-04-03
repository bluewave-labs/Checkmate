const SERVICE_NAME = "NtfyProvider";
import type { Notification } from "@/types/index.js";
import { INotificationProvider } from "@/service/index.js";
import type { NotificationMessage } from "@/types/notificationMessage.js";
import { getTestMessage } from "@/service/infrastructure/notificationProviders/utils.js";
import got from "got";
import { ILogger } from "@/utils/logger.js";

export class NtfyProvider implements INotificationProvider {
    private logger: ILogger;

    constructor(logger: ILogger) {
        this.logger = logger;
    }

    sendTestAlert = async (notification: Partial<Notification>) => {
        if (!notification.address) {
            return false;
        }

        try {
            await got.post(notification.address, {
                body: getTestMessage(),
                headers: {
                    "Content-Type": "text/plain",
                },
            });
            return true;
        } catch (error) {
            const err = error as Error;
            this.logger.warn({
                message: "Ntfy test alert failed",
                service: SERVICE_NAME,
                method: "sendTestAlert",
                stack: err?.stack,
            });
            return false;
        }
    };

    async sendMessage(notification: Notification, message: NotificationMessage): Promise<boolean> {
        if (!notification.address) {
            this.logger.warn({
                message: "Ntfy notification missing URL",
                service: SERVICE_NAME,
                method: "sendMessage",
            });
            return false;
        }

        const text = this.buildNtfyText(message);

        try {
            await got.post(notification.address, {
                body: text,
                headers: {
                    "Content-Type": "text/plain",
                    "Title": message.content.title,
                },
            });
            return true;
        } catch (error) {
            const err = error as Error;
            this.logger.warn({
                message: "Ntfy notification failed",
                service: SERVICE_NAME,
                method: "sendMessage",
                stack: err?.stack,
            });
            return false;
        }
    }

    private buildNtfyText(message: NotificationMessage): string {
        const lines: string[] = [];

        lines.push(message.content.summary);
        lines.push("");

        lines.push("Monitor Details:");
        lines.push(`• Name: ${message.monitor.name}`);
        lines.push(`• URL: ${message.monitor.url}`);
        lines.push(`• Type: ${message.monitor.type}`);
        lines.push(`• Status: ${message.monitor.status}`);
        lines.push(`• Alert: ${message.type} (${message.severity})`);

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
            const incidentUrl =
                message.content.incident.url || `${message.clientHost}/incidents/${message.content.incident.id}`;
            lines.push(`Incident: ${incidentUrl}`);
        }

        return lines.join("\n");
    }
}