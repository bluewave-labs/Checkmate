import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { createMockLogger } from "../../../helpers/createMockLogger.ts";
import { makeNotification, makeMessage, makeMessageWithThresholds, makeMessageWithIncident } from "../../../helpers/notificationMessage.ts";
import { testNotificationProviderContract } from "../../../helpers/notificationProviderContract.ts";

const mockGotPost = jest.fn().mockResolvedValue({});
jest.unstable_mockModule("got", () => ({ default: { post: mockGotPost }, HTTPError: class extends Error {} }));

const { SlackProvider } = await import("../../../../src/service/infrastructure/notificationProviders/slack.ts");

const createProvider = () => {
	const logger = createMockLogger();
	return { provider: new SlackProvider(logger as any), logger };
};

testNotificationProviderContract("SlackProvider", {
	create: () => {
		mockGotPost.mockResolvedValue({});
		return createProvider().provider;
	},
	makeNotification: () => makeNotification(),
});

describe("SlackProvider", () => {
	beforeEach(() => mockGotPost.mockReset().mockResolvedValue({}));

	describe("sendTestAlert", () => {
		it("returns true on success", async () => {
			expect(await createProvider().provider.sendTestAlert(makeNotification())).toBe(true);
		});

		it("returns false when address is missing", async () => {
			expect(await createProvider().provider.sendTestAlert(makeNotification({ address: "" }))).toBe(false);
		});

		it("returns false and logs on error", async () => {
			mockGotPost.mockRejectedValue(new Error("fail"));
			const { provider, logger } = createProvider();
			expect(await provider.sendTestAlert(makeNotification())).toBe(false);
			expect(logger.warn).toHaveBeenCalled();
		});

		it("handles undefined thrown values", async () => {
			mockGotPost.mockRejectedValue(undefined);
			const { provider } = createProvider();
			expect(await provider.sendTestAlert(makeNotification())).toBe(false);
		});
	});

	describe("sendMessage", () => {
		it("sends Block Kit payload and returns true", async () => {
			const { provider } = createProvider();
			expect(await provider.sendMessage(makeNotification() as any, makeMessage())).toBe(true);
			const payload = mockGotPost.mock.calls[0][1].json;
			expect(payload.blocks).toBeDefined();
			expect(payload.attachments).toBeDefined();
		});

		it("returns false when address is missing", async () => {
			expect(await createProvider().provider.sendMessage(makeNotification({ address: "" }) as any, makeMessage())).toBe(false);
		});

		it("returns false and logs on error", async () => {
			mockGotPost.mockRejectedValue(new Error("fail"));
			const { provider, logger } = createProvider();
			expect(await provider.sendMessage(makeNotification() as any, makeMessage())).toBe(false);
			expect(logger.warn).toHaveBeenCalled();
		});

		it("handles undefined thrown values in sendMessage", async () => {
			mockGotPost.mockRejectedValue(undefined);
			const { provider } = createProvider();
			expect(await provider.sendMessage(makeNotification() as any, makeMessage())).toBe(false);
		});

		it("includes threshold section when thresholds present", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeNotification() as any, makeMessageWithThresholds());
			const blocks = mockGotPost.mock.calls[0][1].json.blocks;
			const text = JSON.stringify(blocks);
			expect(text).toContain("Threshold Breaches");
		});

		it("includes incident button when incident present", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeNotification() as any, makeMessageWithIncident());
			const blocks = mockGotPost.mock.calls[0][1].json.blocks;
			expect(blocks.some((b: any) => b.type === "actions")).toBe(true);
		});

		it("includes details section when details are present", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeNotification() as any, makeMessage());
			const blocks = mockGotPost.mock.calls[0][1].json.blocks;
			const text = JSON.stringify(blocks);
			expect(text).toContain("Additional Information");
		});

		it("omits threshold, details, and incident sections when not present", async () => {
			const { provider } = createProvider();
			const msg = makeMessage();
			msg.content.thresholds = undefined;
			msg.content.details = undefined;
			msg.content.incident = undefined;
			await provider.sendMessage(makeNotification() as any, msg);
			const blocks = mockGotPost.mock.calls[0][1].json.blocks;
			const text = JSON.stringify(blocks);
			expect(text).not.toContain("Additional Information");
			expect(blocks.some((b: any) => b.type === "actions")).toBe(false);
		});

		it("maps all severity levels to colors", async () => {
			const { provider } = createProvider();
			for (const severity of ["critical", "warning", "success", "info"] as const) {
				mockGotPost.mockClear();
				await provider.sendMessage(makeNotification() as any, makeMessage({ severity }));
				expect(mockGotPost.mock.calls[0][1].json.attachments[0].color).toBeTruthy();
			}
		});

		it("uses default color for unknown severity", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeNotification() as any, makeMessage({ severity: "unknown" as any }));
			expect(mockGotPost.mock.calls[0][1].json.attachments[0].color).toBe("#808080");
		});
	});
});
