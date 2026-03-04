import { IEmailService } from "@/service/infrastructure/emailService.js";
export const buildTestEmail = async (emailService: IEmailService) => {
	const context = { testName: "Monitoring System" };
	const html = await emailService.buildEmail("testEmailTemplate", context);
	return html;
};

export const getTestMessage = () => {
	return "This is a test notification from Checkmate";
};
