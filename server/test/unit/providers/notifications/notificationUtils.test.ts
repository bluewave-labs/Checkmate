import { describe, expect, it, jest } from "@jest/globals";
import { buildTestEmail, getTestMessage } from "../../../../src/service/infrastructure/notificationProviders/utils.ts";
import type { IEmailService } from "../../../../src/service/infrastructure/emailService.ts";

describe("notification utils", () => {
	describe("getTestMessage", () => {
		it("returns a non-empty string", () => {
			expect(getTestMessage()).toBe("This is a test notification from Checkmate");
		});
	});

	describe("buildTestEmail", () => {
		it("calls emailService.buildEmail with test template and context", async () => {
			const emailService = {
				buildEmail: jest.fn().mockResolvedValue("<html>test</html>"),
			} as unknown as IEmailService;

			const result = await buildTestEmail(emailService);

			expect(emailService.buildEmail).toHaveBeenCalledWith("testEmailTemplate", { testName: "Monitoring System" });
			expect(result).toBe("<html>test</html>");
		});

		it("returns undefined when buildEmail returns undefined", async () => {
			const emailService = {
				buildEmail: jest.fn().mockResolvedValue(undefined),
			} as unknown as IEmailService;

			const result = await buildTestEmail(emailService);

			expect(result).toBeUndefined();
		});
	});
});
