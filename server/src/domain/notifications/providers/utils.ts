import { IEmailService } from "@/service/emailService.js";
import type { NotificationMessage } from "@/domain/notifications/notification.type.js";

// Stands in for settings.clientHost when it is unset; providers that build links check for it and omit the link.
export const CLIENT_HOST_FALLBACK = "Host not defined";

export const incidentUrl = (message: NotificationMessage): string => `${message.clientHost}/incidents/${message.monitor.id}`;

export const buildTestEmail = async (emailService: IEmailService) => {
	const context = { testName: "Monitoring System" };
	const html = await emailService.buildEmail("testEmailTemplate", context);
	return html;
};

export const getTestMessage = () => {
	return "This is a test notification from Checkmate";
};
