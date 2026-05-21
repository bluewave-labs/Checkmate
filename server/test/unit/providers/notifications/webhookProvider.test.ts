import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { createMockLogger } from "../../../helpers/createMockLogger.ts";
import { makeNotification, makeMessage, makeMessageWithThresholds, makeMessageWithIncident } from "../../../helpers/notificationMessage.ts";
import { testNotificationProviderContract } from "../../../helpers/notificationProviderContract.ts";

const mockGotPost = jest.fn().mockResolvedValue({});
jest.unstable_mockModule("got", () => ({ default: { post: mockGotPost } }));

const { WebhookProvider } = await import("../../../../src/service/infrastructure/notificationProviders/webhook.ts");

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

		it("omits threshold and incident sections when not present", async () => {
			const { provider } = createProvider();
			const msg = makeMessage();
			msg.content.thresholds = undefined;
			msg.content.details = undefined;
			msg.content.incident = undefined;
			await provider.sendMessage(makeNotification() as any, msg);
			const text = mockGotPost.mock.calls[0][1].json.text;
			expect(text).not.toContain("Threshold");
			expect(text).not.toContain("Additional Information");
			expect(text).not.toContain("View Incident");
		});
	});

	describe("webhook authentication", () => {
		describe("sendMessage", () => {
			it("sends no Authorization header when authType is none", async () => {
				const { provider } = createProvider();
				await provider.sendMessage(makeNotification({ webhookAuthType: "none" }) as any, makeMessage());
				const headers = mockGotPost.mock.calls[0][1].headers;
				expect(headers.Authorization).toBeUndefined();
			});

			it("sends no Authorization header when webhookAuthType is absent", async () => {
				const { provider } = createProvider();
				await provider.sendMessage(makeNotification() as any, makeMessage());
				const headers = mockGotPost.mock.calls[0][1].headers;
				expect(headers.Authorization).toBeUndefined();
			});

			it("sends Basic auth header with base64-encoded credentials", async () => {
				const { provider } = createProvider();
				await provider.sendMessage(
					makeNotification({ webhookAuthType: "basic", webhookAuthUsername: "user", webhookAuthPassword: "pass" }) as any,
					makeMessage()
				);
				const headers = mockGotPost.mock.calls[0][1].headers;
				const expected = `Basic ${Buffer.from("user:pass").toString("base64")}`;
				expect(headers.Authorization).toBe(expected);
			});

			it("sends no Authorization header for basic auth when credentials are missing", async () => {
				const { provider } = createProvider();
				await provider.sendMessage(makeNotification({ webhookAuthType: "basic" }) as any, makeMessage());
				const headers = mockGotPost.mock.calls[0][1].headers;
				expect(headers.Authorization).toBeUndefined();
			});

			it("sends Bearer auth header with token", async () => {
				const { provider } = createProvider();
				await provider.sendMessage(
					makeNotification({ webhookAuthType: "bearer", webhookAuthToken: "my-secret-token" }) as any,
					makeMessage()
				);
				const headers = mockGotPost.mock.calls[0][1].headers;
				expect(headers.Authorization).toBe("Bearer my-secret-token");
			});

			it("sends no Authorization header for bearer auth when token is missing", async () => {
				const { provider } = createProvider();
				await provider.sendMessage(makeNotification({ webhookAuthType: "bearer" }) as any, makeMessage());
				const headers = mockGotPost.mock.calls[0][1].headers;
				expect(headers.Authorization).toBeUndefined();
			});
		});

		describe("sendTestAlert", () => {
			it("includes Basic auth header in test alert", async () => {
				const { provider } = createProvider();
				await provider.sendTestAlert(makeNotification({ webhookAuthType: "basic", webhookAuthUsername: "admin", webhookAuthPassword: "secret" }));
				const headers = mockGotPost.mock.calls[0][1].headers;
				expect(headers.Authorization).toBe(`Basic ${Buffer.from("admin:secret").toString("base64")}`);
			});

			it("includes Bearer auth header in test alert", async () => {
				const { provider } = createProvider();
				await provider.sendTestAlert(makeNotification({ webhookAuthType: "bearer", webhookAuthToken: "tok123" }));
				const headers = mockGotPost.mock.calls[0][1].headers;
				expect(headers.Authorization).toBe("Bearer tok123");
			});
		});
	});
});
