import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { createMockLogger } from "../../../helpers/createMockLogger.ts";
import { makeNotification, makeMessage, makeMessageWithThresholds, makeMessageWithIncident } from "../../../helpers/notificationMessage.ts";
import { testNotificationProviderContract } from "../../../helpers/notificationProviderContract.ts";

const mockGotPost = jest.fn().mockResolvedValue({});
jest.unstable_mockModule("got", () => ({ default: { post: mockGotPost } }));

const { TelegramProvider } = await import("../../../../src/service/infrastructure/notificationProviders/telegram.ts");

const createProvider = () => {
	const logger = createMockLogger();
	return { provider: new TelegramProvider(logger as any), logger };
};

testNotificationProviderContract("TelegramProvider", {
	create: () => {
		mockGotPost.mockResolvedValue({});
		return createProvider().provider;
	},
	makeNotification: () => makeNotification(),
});

describe("TelegramProvider", () => {
	beforeEach(() => mockGotPost.mockReset().mockResolvedValue({}));

	describe("sendTestAlert", () => {
		it("sends to Telegram API and returns true", async () => {
			expect(await createProvider().provider.sendTestAlert(makeNotification())).toBe(true);
			expect(mockGotPost).toHaveBeenCalledWith(
				expect.stringContaining("api.telegram.org/bottoken-abc/sendMessage"),
				expect.objectContaining({ json: expect.objectContaining({ chat_id: "https://hooks.example.com/webhook" }) })
			);
		});

		it("returns false when address is missing", async () => {
			expect(await createProvider().provider.sendTestAlert(makeNotification({ address: "" }))).toBe(false);
		});

		it("returns false when accessToken is missing", async () => {
			expect(await createProvider().provider.sendTestAlert(makeNotification({ accessToken: undefined }))).toBe(false);
		});

		it("returns false and logs on error", async () => {
			mockGotPost.mockRejectedValue(new Error("fail"));
			const { provider, logger } = createProvider();
			expect(await provider.sendTestAlert(makeNotification())).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ method: "sendTestAlert", details: { error: "fail" } }));
		});

		it("handles non-Error thrown values in sendTestAlert", async () => {
			mockGotPost.mockRejectedValue("string error");
			const { provider, logger } = createProvider();
			expect(await provider.sendTestAlert(makeNotification())).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ stack: undefined, details: { error: "unknown error" } }));
		});
	});

	describe("sendMessage", () => {
		it("sends HTML-formatted text and returns true", async () => {
			const { provider } = createProvider();
			expect(await provider.sendMessage(makeNotification() as any, makeMessage())).toBe(true);
			const json = mockGotPost.mock.calls[0][1].json;
			expect(json.parse_mode).toBe("HTML");
			expect(json.text).toContain("<b>Monitor Down");
		});

		it("returns false when address is missing", async () => {
			expect(await createProvider().provider.sendMessage(makeNotification({ address: "" }) as any, makeMessage())).toBe(false);
		});

		it("returns false when accessToken is missing", async () => {
			expect(await createProvider().provider.sendMessage(makeNotification({ accessToken: undefined }) as any, makeMessage())).toBe(false);
		});

		it("returns false and logs on error", async () => {
			mockGotPost.mockRejectedValue(new Error("fail"));
			const { provider, logger } = createProvider();
			expect(await provider.sendMessage(makeNotification() as any, makeMessage())).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ method: "sendMessage" }));
		});

		it("handles non-Error thrown values in sendMessage", async () => {
			mockGotPost.mockRejectedValue(42);
			const { provider, logger } = createProvider();
			expect(await provider.sendMessage(makeNotification() as any, makeMessage())).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ details: { error: "unknown error" } }));
		});

		it("includes thresholds in text", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeNotification() as any, makeMessageWithThresholds());
			expect(mockGotPost.mock.calls[0][1].json.text).toContain("CPU");
		});

		it("includes incident link in text", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeNotification() as any, makeMessageWithIncident());
			expect(mockGotPost.mock.calls[0][1].json.text).toContain("View Incident");
		});

		it("omits optional sections when not present", async () => {
			const { provider } = createProvider();
			const msg = makeMessage();
			msg.content.thresholds = undefined;
			msg.content.details = undefined;
			msg.content.incident = undefined;
			await provider.sendMessage(makeNotification() as any, msg);
			const text = mockGotPost.mock.calls[0][1].json.text;
			expect(text).not.toContain("Threshold");
			expect(text).not.toContain("Additional");
			expect(text).not.toContain("View Incident");
		});
	});
});
