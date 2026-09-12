import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { createMockLogger } from "../../../helpers/createMockLogger.ts";
import { makeNotification, makeMessage, makeMessageWithThresholds, makeMessageWithIncident } from "../../../helpers/notificationMessage.ts";
import { testNotificationProviderContract } from "../../../helpers/notificationProviderContract.ts";

const mockGotPost = jest.fn().mockResolvedValue({});
jest.unstable_mockModule("got", () => ({ default: { post: mockGotPost } }));

const { WebhookProvider } = await import("../../../../src/domain/notifications/providers/webhook.ts");

const createProvider = () => {
	const logger = createMockLogger();
	return { provider: new WebhookProvider(logger as any), logger };
};

testNotificationProviderContract("WebhookProvider", {
	create: () => {
		mockGotPost.mockResolvedValue({});
		return createProvider().provider;
	},
	makeNotification: () => makeNotification(),
});

describe("WebhookProvider", () => {
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

		it("handles non-Error thrown values", async () => {
			mockGotPost.mockRejectedValue(null);
			const { provider } = createProvider();
			expect(await provider.sendTestAlert(makeNotification())).toBe(false);
		});
	});

	describe("sendMessage", () => {
		it("sends payload with text and structured data", async () => {
			const { provider } = createProvider();
			expect(await provider.sendMessage(makeNotification() as any, makeMessage())).toBe(true);
			const payload = mockGotPost.mock.calls[0][1].json;
			expect(payload.text).toContain("Monitor Down");
			expect(payload.severity).toBe("critical");
			expect(payload.monitor.id).toBe("mon-1");
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

		it("handles non-Error thrown values in sendMessage", async () => {
			mockGotPost.mockRejectedValue(null);
			const { provider } = createProvider();
			expect(await provider.sendMessage(makeNotification() as any, makeMessage())).toBe(false);
		});

		it("includes threshold breaches in text", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeNotification() as any, makeMessageWithThresholds());
			expect(mockGotPost.mock.calls[0][1].json.text).toContain("CPU");
		});

		it("includes incident link in text", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeNotification() as any, makeMessageWithIncident());
			expect(mockGotPost.mock.calls[0][1].json.text).toContain("View Incident");
		});

		it("sends Authorization header with Basic auth", async () => {
			const { provider } = createProvider();
			const notification = makeNotification({
				webhookAuthType: "basic",
				webhookAuthUsername: "admin",
				webhookAuthPassword: "secret",
			});
			await provider.sendMessage(notification as any, makeMessage());
			const headers = mockGotPost.mock.calls[0][1].headers;
			expect(headers.Authorization).toBe(`Basic ${Buffer.from("admin:secret").toString("base64")}`);
		});

		it("sends Authorization header with Bearer auth", async () => {
			const { provider } = createProvider();
			const notification = makeNotification({
				webhookAuthType: "bearer",
				webhookAuthToken: "tok_abc123",
			});
			await provider.sendMessage(notification as any, makeMessage());
			expect(mockGotPost.mock.calls[0][1].headers.Authorization).toBe("Bearer tok_abc123");
		});

		it("does not send Authorization header when authType is none", async () => {
			const { provider } = createProvider();
			const notification = makeNotification({ webhookAuthType: "none" });
			await provider.sendMessage(notification as any, makeMessage());
			expect(mockGotPost.mock.calls[0][1].headers.Authorization).toBeUndefined();
		});

		it("does not send Authorization header when authType is missing (defaults to none)", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeNotification() as any, makeMessage());
			expect(mockGotPost.mock.calls[0][1].headers.Authorization).toBeUndefined();
		});
	});
});
