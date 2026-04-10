import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { EmailProvider } from "../../../../src/service/infrastructure/notificationProviders/email.ts";
import { createMockLogger } from "../../../helpers/createMockLogger.ts";
import { makeNotification, makeMessage } from "../../../helpers/notificationMessage.ts";
import { testNotificationProviderContract } from "../../../helpers/notificationProviderContract.ts";
import type { IEmailService } from "../../../../src/service/infrastructure/emailService.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const createMockEmailService = () =>
	({
		buildEmail: jest.fn().mockResolvedValue("<html>email</html>"),
		sendEmail: jest.fn().mockResolvedValue("msg-123"),
	}) as unknown as jest.Mocked<IEmailService>;

const createProvider = () => {
	const logger = createMockLogger();
	const emailService = createMockEmailService();
	const provider = new EmailProvider(emailService, logger as any);
	return { provider, logger, emailService };
};

testNotificationProviderContract("EmailProvider", {
	create: () => createProvider().provider,
	makeNotification: () => makeNotification(),
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("EmailProvider", () => {
	describe("sendTestAlert", () => {
		it("builds test email and sends it", async () => {
			const { provider, emailService } = createProvider();
			const result = await provider.sendTestAlert(makeNotification());
			expect(result).toBe(true);
			expect(emailService.buildEmail).toHaveBeenCalledWith("testEmailTemplate", { testName: "Monitoring System" });
			expect(emailService.sendEmail).toHaveBeenCalledWith("https://hooks.example.com/webhook", "Test notification", "<html>email</html>");
		});

		it("returns false when address is missing", async () => {
			const { provider, logger } = createProvider();
			expect(await provider.sendTestAlert(makeNotification({ address: "" }))).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: "Missing address" }));
		});

		it("returns false when buildEmail returns undefined", async () => {
			const { provider, emailService, logger } = createProvider();
			(emailService.buildEmail as jest.Mock).mockResolvedValue(undefined);
			expect(await provider.sendTestAlert(makeNotification())).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: "Failed to build test email content" }));
		});

		it("returns false when sendEmail returns falsy", async () => {
			const { provider, emailService, logger } = createProvider();
			(emailService.sendEmail as jest.Mock).mockResolvedValue(false);
			expect(await provider.sendTestAlert(makeNotification())).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: "Email test alert failed" }));
		});
	});

	describe("sendMessage", () => {
		it("builds email from message and sends it", async () => {
			const { provider, emailService } = createProvider();
			const result = await provider.sendMessage(makeNotification() as any, makeMessage());
			expect(result).toBe(true);
			expect(emailService.buildEmail).toHaveBeenCalledWith(
				"unifiedNotificationTemplate",
				expect.objectContaining({ title: "Monitor Down: Test Monitor" })
			);
			expect(emailService.sendEmail).toHaveBeenCalled();
		});

		it("returns false when address is missing", async () => {
			const { provider } = createProvider();
			expect(await provider.sendMessage(makeNotification({ address: "" }) as any, makeMessage())).toBe(false);
		});

		it("returns false when buildEmail returns undefined", async () => {
			const { provider, emailService, logger } = createProvider();
			(emailService.buildEmail as jest.Mock).mockResolvedValue(undefined);
			expect(await provider.sendMessage(makeNotification() as any, makeMessage())).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: "Failed to build email content" }));
		});

		it("returns false when sendEmail returns falsy", async () => {
			const { provider, emailService, logger } = createProvider();
			(emailService.sendEmail as jest.Mock).mockResolvedValue(undefined);
			expect(await provider.sendMessage(makeNotification() as any, makeMessage())).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: "Email notification failed" }));
		});

		it("builds correct subject for monitor_down", async () => {
			const { provider, emailService } = createProvider();
			await provider.sendMessage(makeNotification() as any, makeMessage({ type: "monitor_down" }));
			expect(emailService.sendEmail).toHaveBeenCalledWith(expect.anything(), "Monitor Test Monitor is down", expect.anything());
		});

		it("builds correct subject for monitor_up", async () => {
			const { provider, emailService } = createProvider();
			await provider.sendMessage(makeNotification() as any, makeMessage({ type: "monitor_up" }));
			expect(emailService.sendEmail).toHaveBeenCalledWith(expect.anything(), "Monitor Test Monitor is back up", expect.anything());
		});

		it("builds correct subject for threshold_breach", async () => {
			const { provider, emailService } = createProvider();
			await provider.sendMessage(makeNotification() as any, makeMessage({ type: "threshold_breach" }));
			expect(emailService.sendEmail).toHaveBeenCalledWith(expect.anything(), "Monitor Test Monitor threshold exceeded", expect.anything());
		});

		it("builds correct subject for threshold_resolved", async () => {
			const { provider, emailService } = createProvider();
			await provider.sendMessage(makeNotification() as any, makeMessage({ type: "threshold_resolved" }));
			expect(emailService.sendEmail).toHaveBeenCalledWith(expect.anything(), "Monitor Test Monitor thresholds resolved", expect.anything());
		});

		it("builds default subject for unknown type", async () => {
			const { provider, emailService } = createProvider();
			await provider.sendMessage(makeNotification() as any, makeMessage({ type: "test" }));
			expect(emailService.sendEmail).toHaveBeenCalledWith(expect.anything(), "Alert: Test Monitor", expect.anything());
		});

		it("passes incident url in context when present", async () => {
			const { provider, emailService } = createProvider();
			const msg = makeMessage();
			msg.content.incident = { id: "inc-1", url: "https://app.example.com/incidents/inc-1", createdAt: new Date() };
			await provider.sendMessage(makeNotification() as any, msg);
			expect(emailService.buildEmail).toHaveBeenCalledWith(
				"unifiedNotificationTemplate",
				expect.objectContaining({ incidentUrl: "https://app.example.com/incidents/inc-1" })
			);
		});

		it("maps all severity levels to colors", async () => {
			const { provider, emailService } = createProvider();
			const severityColors: Record<string, string> = { critical: "red", warning: "#f59e0b", info: "#3b82f6", success: "green" };
			for (const [severity, color] of Object.entries(severityColors)) {
				(emailService.buildEmail as jest.Mock).mockClear();
				await provider.sendMessage(makeNotification() as any, makeMessage({ severity: severity as any }));
				expect(emailService.buildEmail).toHaveBeenCalledWith("unifiedNotificationTemplate", expect.objectContaining({ headerColor: color }));
			}
		});

		it("uses default color for unknown severity", async () => {
			const { provider, emailService } = createProvider();
			await provider.sendMessage(makeNotification() as any, makeMessage({ severity: "unknown" as any }));
			expect(emailService.buildEmail).toHaveBeenCalledWith("unifiedNotificationTemplate", expect.objectContaining({ headerColor: "#3b82f6" }));
		});
	});
});
