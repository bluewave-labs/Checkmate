import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { createMockLogger } from "../../../helpers/createMockLogger.ts";
import { makeMessage, makeMessageWithIncident, makeMessageWithThresholds, makeNotification } from "../../../helpers/notificationMessage.ts";
import { testNotificationProviderContract } from "../../../helpers/notificationProviderContract.ts";

const mockGotPost = jest.fn().mockResolvedValue({});
jest.unstable_mockModule("got", () => ({ default: { post: mockGotPost } }));
const { NtfyProvider } = await import("../../../../src/service/infrastructure/notificationProviders/ntfy.ts");

const createProvider = () => {
	const logger = createMockLogger();
	const provider = new NtfyProvider(logger as any);
	return { provider, logger };
};

testNotificationProviderContract("NtfyProvider", {
	create: () => {
		mockGotPost.mockResolvedValue({});
		return createProvider().provider;
	},
	makeNotification: () => makeNotification(),
});

describe("NtfyProvider", () => {
	beforeEach(() => {
		mockGotPost.mockReset().mockResolvedValue({});
	});

	describe("sendTestAlert", () => {
		it("sends test message and returns true", async () => {
			const { provider } = createProvider();
			const result = await provider.sendTestAlert(makeNotification({ accessToken: "" }));
			expect(result).toBe(true);
			expect(mockGotPost).toHaveBeenCalledWith("https://hooks.example.com/webhook", expect.objectContaining({ body: expect.any(String) }));
		});

		it("returns false when address is missing", async () => {
			const { provider } = createProvider();
			expect(await provider.sendTestAlert(makeNotification({ address: "" }))).toBe(false);
		});

		it("returns false and logs on error", async () => {
			mockGotPost.mockRejectedValue(new Error("network"));
			const { provider, logger } = createProvider();
			expect(await provider.sendTestAlert(makeNotification())).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ method: "sendTestAlert" }));
		});

		it("handles undefined thrown values in sendMessage", async () => {
			mockGotPost.mockRejectedValue(undefined);
			const { provider, logger } = createProvider();
			expect(await provider.sendMessage(makeNotification() as any, makeMessage())).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ stack: undefined }));
		});
	});

	describe("sendMessage", () => {
		it("sends message and returns true", async () => {
			const { provider } = createProvider();
			const result = await provider.sendMessage(makeNotification({ accessToken: "" }), makeMessage());
			expect(result).toBe(true);
			expect(mockGotPost).toHaveBeenCalledWith("https://hooks.example.com/webhook", expect.objectContaining({ body: expect.any(String) }));
		});

		it("returns false when address is missing", async () => {
			const { provider } = createProvider();
			expect(await provider.sendTestAlert(makeNotification({ address: "" }))).toBe(false);
		});

		it("returns false and logs on error", async () => {
			mockGotPost.mockRejectedValue(new Error("network"));
			const { provider, logger } = createProvider();
			expect(await provider.sendTestAlert(makeNotification())).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ method: "sendTestAlert" }));
		});

		it("handles undefined thrown values in sendMessage", async () => {
			mockGotPost.mockRejectedValue(undefined);
			const { provider, logger } = createProvider();
			expect(await provider.sendMessage(makeNotification() as any, makeMessage())).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ stack: undefined }));
		});

		it("includes threshold section when thresholds present", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeNotification() as any, makeMessageWithThresholds());
			const body = mockGotPost.mock.calls[0][1].body;
			expect(body).toContain("Threshold Breaches");
		});

		it("includes incident button when incident present", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeNotification() as any, makeMessageWithIncident());
			const body = mockGotPost.mock.calls[0][1].body;
			expect(body).toContain("Incident");
		});

		it("includes details section when details are present", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeNotification() as any, makeMessage());
			const body = mockGotPost.mock.calls[0][1].body;
			expect(body).toContain("Additional Information");
		});

		it("omits threshold, details, and incident sections when not present", async () => {
			const { provider } = createProvider();
			const msg = makeMessage();
			msg.content.thresholds = undefined;
			msg.content.details = undefined;
			msg.content.incident = undefined;
			await provider.sendMessage(makeNotification() as any, msg);
			const body = mockGotPost.mock.calls[0][1].body;
			expect(body).not.toContain("Threshold");
			expect(body).not.toContain("Additional Information");
			expect(body).not.toContain("View Incident");
		});
	});
});
