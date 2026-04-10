import { describe, expect, it, jest } from "@jest/globals";
import { createMockLogger } from "../../../helpers/createMockLogger.ts";
import { makeNotification, makeMessage, makeMessageWithThresholds, makeMessageWithIncident } from "../../../helpers/notificationMessage.ts";
import { testNotificationProviderContract } from "../../../helpers/notificationProviderContract.ts";

const mockGotPost = jest.fn().mockResolvedValue({});
jest.unstable_mockModule("got", () => ({ default: { post: mockGotPost } }));

const { DiscordProvider } = await import("../../../../src/service/infrastructure/notificationProviders/discord.ts");

const createProvider = () => {
	const logger = createMockLogger();
	const provider = new DiscordProvider(logger as any);
	return { provider, logger };
};

testNotificationProviderContract("DiscordProvider", {
	create: () => {
		mockGotPost.mockResolvedValue({});
		return createProvider().provider;
	},
	makeNotification: () => makeNotification(),
});

describe("DiscordProvider", () => {
	beforeEach(() => mockGotPost.mockReset().mockResolvedValue({}));

	describe("sendTestAlert", () => {
		it("sends test message and returns true", async () => {
			const { provider } = createProvider();
			const result = await provider.sendTestAlert(makeNotification());
			expect(result).toBe(true);
			expect(mockGotPost).toHaveBeenCalledWith(
				"https://hooks.example.com/webhook",
				expect.objectContaining({ json: expect.objectContaining({ content: expect.any(String) }) })
			);
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

		it("handles undefined thrown values", async () => {
			mockGotPost.mockRejectedValue(undefined);
			const { provider, logger } = createProvider();
			expect(await provider.sendTestAlert(makeNotification())).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ stack: undefined }));
		});
	});

	describe("sendMessage", () => {
		it("sends embed and returns true", async () => {
			const { provider } = createProvider();
			const result = await provider.sendMessage(makeNotification() as any, makeMessage());
			expect(result).toBe(true);
			expect(mockGotPost).toHaveBeenCalledWith(
				"https://hooks.example.com/webhook",
				expect.objectContaining({ json: expect.objectContaining({ embeds: expect.any(Array) }) })
			);
		});

		it("returns false when address is missing", async () => {
			const { provider } = createProvider();
			expect(await provider.sendMessage(makeNotification({ address: "" }) as any, makeMessage())).toBe(false);
		});

		it("returns false and logs on error", async () => {
			mockGotPost.mockRejectedValue(new Error("fail"));
			const { provider, logger } = createProvider();
			expect(await provider.sendMessage(makeNotification() as any, makeMessage())).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ method: "sendMessage" }));
		});

		it("handles undefined thrown values in sendMessage", async () => {
			mockGotPost.mockRejectedValue(undefined);
			const { provider, logger } = createProvider();
			expect(await provider.sendMessage(makeNotification() as any, makeMessage())).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ stack: undefined }));
		});

		it("includes threshold breaches in embed fields", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeNotification() as any, makeMessageWithThresholds());
			const payload = mockGotPost.mock.calls[0][1].json;
			const fields = payload.embeds[0].fields;
			expect(fields.some((f: any) => f.name === "Threshold Breaches")).toBe(true);
		});

		it("includes details in embed fields", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeNotification() as any, makeMessage());
			const fields = mockGotPost.mock.calls[0][1].json.embeds[0].fields;
			expect(fields.some((f: any) => f.name === "Details")).toBe(true);
		});

		it("maps all severity levels to colors", async () => {
			const { provider } = createProvider();
			for (const severity of ["critical", "warning", "success", "info"] as const) {
				mockGotPost.mockClear();
				await provider.sendMessage(makeNotification() as any, makeMessage({ severity }));
				const color = mockGotPost.mock.calls[0][1].json.embeds[0].color;
				expect(color).toBeGreaterThan(0);
			}
		});

		it("uses info color for unknown severity", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeNotification() as any, makeMessage({ severity: "unknown" as any }));
			const color = mockGotPost.mock.calls[0][1].json.embeds[0].color;
			expect(color).toBe(0x3b82f6);
		});

		it("omits threshold fields when not present", async () => {
			const { provider } = createProvider();
			const msg = makeMessage();
			msg.content.thresholds = undefined;
			msg.content.details = undefined;
			await provider.sendMessage(makeNotification() as any, msg);
			const fields = mockGotPost.mock.calls[0][1].json.embeds[0].fields;
			expect(fields.some((f: any) => f.name === "Threshold Breaches")).toBe(false);
			expect(fields.some((f: any) => f.name === "Details")).toBe(false);
		});
	});
});
