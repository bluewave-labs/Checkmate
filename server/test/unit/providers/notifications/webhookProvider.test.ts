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

		it("omits Authorization header when authType is none", async () => {
			const { provider } = createProvider();
			await provider.sendTestAlert(makeNotification({ authType: "none" }));
			const headers = mockGotPost.mock.calls[0][1].headers;
			expect(headers.Authorization).toBeUndefined();
			expect(headers["Content-Type"]).toBe("application/json");
		});

		it("sends Basic Authorization when authType is basic", async () => {
			const { provider } = createProvider();
			await provider.sendTestAlert(
				makeNotification({
					authType: "basic",
					authUsername: "user",
					authPassword: "secret",
				})
			);
			const headers = mockGotPost.mock.calls[0][1].headers;
			expect(headers.Authorization).toBe(`Basic ${Buffer.from("user:secret").toString("base64")}`);
		});

		it("sends Bearer Authorization when authType is bearer", async () => {
			const { provider } = createProvider();
			await provider.sendTestAlert(
				makeNotification({
					authType: "bearer",
					authToken: "my-bearer-token",
				})
			);
			const headers = mockGotPost.mock.calls[0][1].headers;
			expect(headers.Authorization).toBe("Bearer my-bearer-token");
		});

		it("omits Authorization when basic auth is missing password", async () => {
			const { provider } = createProvider();
			await provider.sendTestAlert(
				makeNotification({
					authType: "basic",
					authUsername: "user",
					authPassword: undefined,
				})
			);
			const headers = mockGotPost.mock.calls[0][1].headers;
			expect(headers.Authorization).toBeUndefined();
		});

		it("omits Authorization when bearer auth is missing token", async () => {
			const { provider } = createProvider();
			await provider.sendTestAlert(
				makeNotification({
					authType: "bearer",
					authToken: undefined,
				})
			);
			const headers = mockGotPost.mock.calls[0][1].headers;
			expect(headers.Authorization).toBeUndefined();
		});

		it("omits Authorization when basic auth is missing username", async () => {
			const { provider } = createProvider();
			await provider.sendTestAlert(
				makeNotification({
					authType: "basic",
					authUsername: undefined,
					authPassword: "secret",
				})
			);
			const headers = mockGotPost.mock.calls[0][1].headers;
			expect(headers.Authorization).toBeUndefined();
		});

		it("handles empty strings for auth fields by omitting Authorization", async () => {
			const { provider } = createProvider();

			await provider.sendTestAlert(
				makeNotification({
					authType: "basic",
					authUsername: "",
					authPassword: "",
				})
			);
			expect(mockGotPost.mock.calls[0][1].headers.Authorization).toBeUndefined();

			await provider.sendTestAlert(
				makeNotification({
					authType: "bearer",
					authToken: "",
				})
			);
			expect(mockGotPost.mock.calls[1][1].headers.Authorization).toBeUndefined();
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

		it("sends Basic Authorization on sendMessage when authType is basic", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(
				makeNotification({
					authType: "basic",
					authUsername: "user",
					authPassword: "secret",
				}) as any,
				makeMessage()
			);
			const headers = mockGotPost.mock.calls[0][1].headers;
			expect(headers.Authorization).toBe(`Basic ${Buffer.from("user:secret").toString("base64")}`);
		});
	});
});
