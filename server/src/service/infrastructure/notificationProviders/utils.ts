import { Monitor, HardwareStatusPayload, MonitorStatusResponse } from "@/types/index.js";
// Test notification helpers - used by all providers for test alerts
export const buildTestEmail = async (emailService: any) => {
	const context = { testName: "Monitoring System" };
	const html = await emailService.buildEmail("testEmailTemplate", context);
	return html;
};

export const getTestMessage = () => {
	return "This is a test notification from Checkmate";
};
