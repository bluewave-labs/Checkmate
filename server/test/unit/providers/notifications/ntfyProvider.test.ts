import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { createMockLogger } from "../../../helpers/createMockLogger.ts";
import { makeNotification, makeMessage, makeMessageWithThresholds, makeMessageWithIncident } from "../../../helpers/notificationMessage.ts";
import { testNotificationProviderContract } from "../../../helpers/notificationProviderContract.ts";

const mockGotPost = jest.fn().mockResolvedValue({});
jest.unstable_mockModule("got", () => ({ default: { post: mockGotPost } }));

const { NtfyProvider } = await import("../../../../src/domain/notifications/providers/ntfy.ts");

const createProvider = () => {
	const logger = createMockLogger();
	return { provider: new NtfyProvider(logger as any), logger };
};

const makeNtfyNotification = (overrides = {}) =>
	makeNotification({
		address: "https://ntfy.sh/",
		topic: "checkmate-alerts",
		...overrides,
	});

testNotificationProviderContract("NtfyProvider", {
	create: () => {
		mockGotPost.mockResolvedValue({});
		return createProvider().provider;
	},
	makeNotification: () => makeNtfyNotification(),
});

describe("NtfyProvider", () => {
	beforeEach(() => mockGotPost.mockReset().mockResolvedValue({}));

	describe("sendTestAlert", () => {
		it("posts the test message to the configured topic", async () => {
			expect(await createProvider().provider.sendTestAlert(makeNtfyNotification())).toBe(true);
			expect(mockGotPost).toHaveBeenCalledWith(
				"https://ntfy.sh/checkmate-alerts",
				expect.objectContaining({
					body: expect.any(String),
					headers: expect.objectContaining({ Title: "Checkmate test notification" }),
				})
			);
		});

		it("returns false when address is missing", async () => {
			expect(await createProvider().provider.sendTestAlert(makeNtfyNotification({ address: "" }))).toBe(false);
		});

		it("returns false when topic is missing", async () => {
			expect(await createProvider().provider.sendTestAlert(makeNtfyNotification({ topic: "" }))).toBe(false);
		});

		it("returns false and logs on error", async () => {
			mockGotPost.mockRejectedValue(new Error("fail"));
			const { provider, logger } = createProvider();
			expect(await provider.sendTestAlert(makeNtfyNotification())).toBe(false);
			expect(logger.warn).toHaveBeenCalled();
		});
	});

	describe("sendMessage", () => {
		it("posts plain text with severity headers to the configured topic", async () => {
			const { provider } = createProvider();
			expect(await provider.sendMessage(makeNtfyNotification() as any, makeMessage())).toBe(true);
			expect(mockGotPost).toHaveBeenCalledWith(
				"https://ntfy.sh/checkmate-alerts",
				expect.objectContaining({
					body: expect.stringContaining("Monitor Details"),
					headers: expect.objectContaining({
						Title: "Monitor Down: Test Monitor",
						Priority: "high",
						Tags: "rotating_light",
					}),
				})
			);
		});

		it("url-encodes topics", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeNtfyNotification({ topic: "ops alerts" }) as any, makeMessage());
			expect(mockGotPost.mock.calls[0][0]).toBe("https://ntfy.sh/ops%20alerts");
		});

		it("returns false when address is missing", async () => {
			expect(await createProvider().provider.sendMessage(makeNtfyNotification({ address: "" }) as any, makeMessage())).toBe(false);
		});

		it("returns false when topic is missing", async () => {
			expect(await createProvider().provider.sendMessage(makeNtfyNotification({ topic: "" }) as any, makeMessage())).toBe(false);
		});

		it("returns false and logs on error", async () => {
			mockGotPost.mockRejectedValue(new Error("fail"));
			const { provider, logger } = createProvider();
			expect(await provider.sendMessage(makeNtfyNotification() as any, makeMessage())).toBe(false);
			expect(logger.warn).toHaveBeenCalled();
		});

		it("includes threshold breaches in text", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeNtfyNotification() as any, makeMessageWithThresholds());
			expect(mockGotPost.mock.calls[0][1].body).toContain("CPU");
		});

		it("includes incident links in text", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeNtfyNotification() as any, makeMessageWithIncident());
			expect(mockGotPost.mock.calls[0][1].body).toContain("/infrastructure/mon-1");
		});
	});

	describe("authentication", () => {
		const authHeaderOf = () => mockGotPost.mock.calls[0][1].headers.Authorization;

		it("sends no Authorization header when no auth type is configured", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeNtfyNotification() as any, makeMessage());
			expect(authHeaderOf()).toBeUndefined();
		});

		it("sends no Authorization header when auth type is none", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeNtfyNotification({ ntfyAuthType: "none" }) as any, makeMessage());
			expect(authHeaderOf()).toBeUndefined();
		});

		it("sends a bearer token for token auth", async () => {
			const { provider } = createProvider();
			const notification = makeNtfyNotification({ ntfyAuthType: "token", accessToken: "tk_secret" });
			expect(await provider.sendMessage(notification as any, makeMessage())).toBe(true);
			expect(authHeaderOf()).toBe("Bearer tk_secret");
		});

		it("sends base64 encoded credentials for basic auth", async () => {
			const { provider } = createProvider();
			const notification = makeNtfyNotification({ ntfyAuthType: "basic", ntfyUsername: "alice", accessToken: "s3cret" });
			expect(await provider.sendMessage(notification as any, makeMessage())).toBe(true);
			expect(authHeaderOf()).toBe(`Basic ${Buffer.from("alice:s3cret").toString("base64")}`);
		});

		it("authenticates test alerts as well as alerts", async () => {
			const { provider } = createProvider();
			const notification = makeNtfyNotification({ ntfyAuthType: "token", accessToken: "tk_secret" });
			expect(await provider.sendTestAlert(notification)).toBe(true);
			expect(authHeaderOf()).toBe("Bearer tk_secret");
		});

		it("preserves the notification headers alongside the Authorization header", async () => {
			const { provider } = createProvider();
			const notification = makeNtfyNotification({ ntfyAuthType: "token", accessToken: "tk_secret" });
			await provider.sendMessage(notification as any, makeMessage());
			expect(mockGotPost.mock.calls[0][1].headers).toEqual(
				expect.objectContaining({
					Title: "Monitor Down: Test Monitor",
					Priority: "high",
					Tags: "rotating_light",
					Authorization: "Bearer tk_secret",
				})
			);
		});

		// A misconfigured channel must fail loudly rather than post anonymously to a topic
		// the operator believes is protected.
		it("refuses to send unauthenticated when token auth has no access token", async () => {
			const { provider, logger } = createProvider();
			const notification = makeNtfyNotification({ ntfyAuthType: "token", accessToken: "" });
			expect(await provider.sendMessage(notification as any, makeMessage())).toBe(false);
			expect(mockGotPost).not.toHaveBeenCalled();
			expect(logger.warn).toHaveBeenCalled();
		});

		it("refuses to send unauthenticated when basic auth has no username", async () => {
			const { provider, logger } = createProvider();
			const notification = makeNtfyNotification({ ntfyAuthType: "basic", accessToken: "s3cret" });
			expect(await provider.sendMessage(notification as any, makeMessage())).toBe(false);
			expect(mockGotPost).not.toHaveBeenCalled();
			expect(logger.warn).toHaveBeenCalled();
		});

		it("refuses to send unauthenticated when basic auth has no password", async () => {
			const { provider, logger } = createProvider();
			const notification = makeNtfyNotification({ ntfyAuthType: "basic", ntfyUsername: "alice", accessToken: "" });
			expect(await provider.sendMessage(notification as any, makeMessage())).toBe(false);
			expect(mockGotPost).not.toHaveBeenCalled();
			expect(logger.warn).toHaveBeenCalled();
		});

		it("refuses to send an unauthenticated test alert when credentials are incomplete", async () => {
			const { provider } = createProvider();
			expect(await provider.sendTestAlert(makeNtfyNotification({ ntfyAuthType: "token", accessToken: "" }))).toBe(false);
			expect(mockGotPost).not.toHaveBeenCalled();
		});
	});
});
