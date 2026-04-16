import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { createMockLogger } from "../../../helpers/createMockLogger.ts";
import { makeNotification, makeMessage, makeMessageWithThresholds, makeMessageWithIncident } from "../../../helpers/notificationMessage.ts";
import { testNotificationProviderContract } from "../../../helpers/notificationProviderContract.ts";

const mockGotPost = jest.fn().mockResolvedValue({});
jest.unstable_mockModule("got", () => ({ default: { post: mockGotPost } }));

const { TwilioProvider } = await import("../../../../src/service/infrastructure/notificationProviders/twilio.ts");

const createProvider = () => {
	const logger = createMockLogger();
	return { provider: new TwilioProvider(logger as any), logger };
};

const makeTwilioNotification = (overrides?: Record<string, unknown>) =>
	makeNotification({
		phone: "+15559876543",
		homeserverUrl: "+15551234567",
		...overrides,
	});

testNotificationProviderContract("TwilioProvider", {
	create: () => {
		mockGotPost.mockResolvedValue({});
		return createProvider().provider;
	},
	makeNotification: () => makeTwilioNotification(),
});

describe("TwilioProvider", () => {
	beforeEach(() => mockGotPost.mockReset().mockResolvedValue({}));

	describe("sendTestAlert", () => {
		it("sends to Twilio API and returns true", async () => {
			expect(await createProvider().provider.sendTestAlert(makeTwilioNotification())).toBe(true);
			expect(mockGotPost).toHaveBeenCalledWith(
				expect.stringContaining("api.twilio.com/2010-04-01/Accounts/"),
				expect.objectContaining({
					form: expect.objectContaining({ To: "+15559876543", From: "+15551234567" }),
					username: expect.any(String),
					password: expect.any(String),
				})
			);
		});

		it("returns false when address is missing", async () => {
			expect(await createProvider().provider.sendTestAlert(makeTwilioNotification({ address: "" }))).toBe(false);
		});

		it("returns false when accessToken is missing", async () => {
			expect(await createProvider().provider.sendTestAlert(makeTwilioNotification({ accessToken: undefined }))).toBe(false);
		});

		it("returns false when phone is missing", async () => {
			expect(await createProvider().provider.sendTestAlert(makeTwilioNotification({ phone: "" }))).toBe(false);
		});

		it("returns false when homeserverUrl (from number) is missing", async () => {
			expect(await createProvider().provider.sendTestAlert(makeTwilioNotification({ homeserverUrl: "" }))).toBe(false);
		});

		it("returns false and logs on error", async () => {
			mockGotPost.mockRejectedValue(new Error("fail"));
			const { provider, logger } = createProvider();
			expect(await provider.sendTestAlert(makeTwilioNotification())).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ method: "sendTestAlert", details: { error: "fail" } }));
		});

		it("handles non-Error thrown values in sendTestAlert", async () => {
			mockGotPost.mockRejectedValue("string error");
			const { provider, logger } = createProvider();
			expect(await provider.sendTestAlert(makeTwilioNotification())).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ stack: undefined, details: { error: "unknown error" } }));
		});
	});

	describe("sendMessage", () => {
		it("sends SMS and returns true", async () => {
			const { provider } = createProvider();
			expect(await provider.sendMessage(makeTwilioNotification() as any, makeMessage())).toBe(true);
			const form = mockGotPost.mock.calls[0][1].form;
			expect(form.Body).toContain("Monitor Down");
			expect(form.To).toBe("+15559876543");
			expect(form.From).toBe("+15551234567");
		});

		it("returns false when address is missing", async () => {
			expect(await createProvider().provider.sendMessage(makeTwilioNotification({ address: "" }) as any, makeMessage())).toBe(false);
		});

		it("returns false when accessToken is missing", async () => {
			expect(await createProvider().provider.sendMessage(makeTwilioNotification({ accessToken: undefined }) as any, makeMessage())).toBe(false);
		});

		it("returns false when phone is missing", async () => {
			expect(await createProvider().provider.sendMessage(makeTwilioNotification({ phone: "" }) as any, makeMessage())).toBe(false);
		});

		it("returns false and logs on error", async () => {
			mockGotPost.mockRejectedValue(new Error("fail"));
			const { provider, logger } = createProvider();
			expect(await provider.sendMessage(makeTwilioNotification() as any, makeMessage())).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ method: "sendMessage" }));
		});

		it("handles non-Error thrown values in sendMessage", async () => {
			mockGotPost.mockRejectedValue(42);
			const { provider, logger } = createProvider();
			expect(await provider.sendMessage(makeTwilioNotification() as any, makeMessage())).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ details: { error: "unknown error" } }));
		});

		it("includes thresholds in text", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeTwilioNotification() as any, makeMessageWithThresholds());
			expect(mockGotPost.mock.calls[0][1].form.Body).toContain("CPU");
		});

		it("includes monitor URL in text", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeTwilioNotification() as any, makeMessage());
			expect(mockGotPost.mock.calls[0][1].form.Body).toContain("https://example.com");
		});

		it("omits thresholds when not present", async () => {
			const { provider } = createProvider();
			const msg = makeMessage();
			msg.content.thresholds = undefined;
			await provider.sendMessage(makeTwilioNotification() as any, msg);
			const text = mockGotPost.mock.calls[0][1].form.Body;
			expect(text).not.toContain("CPU");
		});
	});
});
