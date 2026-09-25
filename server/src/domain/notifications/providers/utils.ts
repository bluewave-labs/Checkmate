import { IEmailService } from "@/service/emailService.js";
import type { NotificationMessage } from "@/domain/notifications/notification.type.js";

export const incidentUrl = (message: NotificationMessage): string => `${message.clientHost}/incidents/${message.monitor.id}`;

export const buildTestEmail = async (emailService: IEmailService) => {
	const context = { testName: "Monitoring System" };
	const html = await emailService.buildEmail("testEmailTemplate", context);
	return html;
};

export const getTestMessage = () => {
	return "This is a test notification from Checkmate";
};
