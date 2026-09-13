import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { createMockLogger } from "../../../helpers/createMockLogger.ts";
import { makeNotification, makeMessage, makeMessageWithThresholds, makeMessageWithIncident } from "../../../helpers/notificationMessage.ts";
import { testNotificationProviderContract } from "../../../helpers/notificationProviderContract.ts";

const mockGotPost = jest.fn().mockResolvedValue({});
jest.unstable_mockModule("got", () => ({ default: { post: mockGotPost } }));

const { AppriseProvider } = await import("../../../../src/domain/notifications/providers/apprise.ts");

const createProvider = () => {
	const logger = createMockLogger();
	return { provider: new AppriseProvider(logger as any), logger };
};

const makeAppriseNotification = (overrides = {}) =>
	makeNotification({
		address: "https://apprise.example.com/",
		topic: "checkmate",
		appriseUrls: "",
		...overrides,
	});

const postedJson = () => mockGotPost.mock.calls[0][1].json;

testNotificationProviderContract("AppriseProvider", {
	create: () => {
		mockGotPost.mockResolvedValue({});
		return createProvider().provider;
	},
	makeNotification: () => makeAppriseNotification(),
});

describe("AppriseProvider", () => {
	beforeEach(() => mockGotPost.mockReset().mockResolvedValue({}));

	describe("sendTestAlert", () => {
		it("posts the test message to the configuration key", async () => {
			expect(await createProvider().provider.sendTestAlert(makeAppriseNotification())).toBe(true);
			expect(mockGotPost).toHaveBeenCalledWith(
				"https://apprise.example.com/notify/checkmate",
				expect.objectContaining({
					json: expect.objectContaining({ title: "Checkmate test notification", type: "info", format: "text" }),
				})
			);
		});

		it("returns false when address is missing", async () => {
			expect(await createProvider().provider.sendTestAlert(makeAppriseNotification({ address: "" }))).toBe(false);
			expect(mockGotPost).not.toHaveBeenCalled();
		});

		it("returns false and logs on error", async () => {
			mockGotPost.mockRejectedValue(new Error("fail"));
			const { provider, logger } = createProvider();
			expect(await provider.sendTestAlert(makeAppriseNotification())).toBe(false);
			expect(logger.warn).toHaveBeenCalled();
		});
	});

	describe("sendMessage", () => {
		it("posts the alert to the configuration key with a mapped type", async () => {
			const { provider } = createProvider();
			expect(await provider.sendMessage(makeAppriseNotification() as any, makeMessage())).toBe(true);
			expect(mockGotPost).toHaveBeenCalledWith(
				"https://apprise.example.com/notify/checkmate",
				expect.objectContaining({
					json: expect.objectContaining({
						title: "Monitor Down: Test Monitor",
						body: expect.stringContaining("Monitor Details"),
						type: "failure",
						format: "text",
					}),
				})
			);
			expect(postedJson().urls).toBeUndefined();
		});

		it("posts Apprise URLs to the stateless endpoint when no key is set", async () => {
			const { provider } = createProvider();
			const notification = makeAppriseNotification({ topic: "", appriseUrls: "tgram://token/chat, mailto://user:pass@example.com" });
			expect(await provider.sendMessage(notification as any, makeMessage())).toBe(true);
			expect(mockGotPost.mock.calls[0][0]).toBe("https://apprise.example.com/notify");
			expect(postedJson().urls).toBe("tgram://token/chat, mailto://user:pass@example.com");
		});

		it("prefers the configuration key when both are set", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeAppriseNotification({ appriseUrls: "tgram://token/chat" }) as any, makeMessage());
			expect(mockGotPost.mock.calls[0][0]).toBe("https://apprise.example.com/notify/checkmate");
			expect(postedJson().urls).toBeUndefined();
		});

		it("url-encodes the configuration key", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeAppriseNotification({ topic: "ops alerts" }) as any, makeMessage());
			expect(mockGotPost.mock.calls[0][0]).toBe("https://apprise.example.com/notify/ops%20alerts");
		});

		it.each([
			["critical", "failure"],
			["warning", "warning"],
			["success", "success"],
			["info", "info"],
		])("maps %s severity to Apprise type %s", async (severity, expected) => {
			const { provider } = createProvider();
			await provider.sendMessage(makeAppriseNotification() as any, makeMessage({ severity: severity as any }));
			expect(postedJson().type).toBe(expected);
		});

		it("returns false when address is missing", async () => {
			expect(await createProvider().provider.sendMessage(makeAppriseNotification({ address: "" }) as any, makeMessage())).toBe(false);
		});

		it("returns false and logs when neither a key nor URLs are configured", async () => {
			const { provider, logger } = createProvider();
			expect(await provider.sendMessage(makeAppriseNotification({ topic: "", appriseUrls: "  " }) as any, makeMessage())).toBe(false);
			expect(mockGotPost).not.toHaveBeenCalled();
			expect(logger.warn).toHaveBeenCalled();
		});

		it("returns false and logs on error", async () => {
			mockGotPost.mockRejectedValue(new Error("fail"));
			const { provider, logger } = createProvider();
			expect(await provider.sendMessage(makeAppriseNotification() as any, makeMessage())).toBe(false);
			expect(logger.warn).toHaveBeenCalled();
		});

		it("includes threshold breaches in the body", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeAppriseNotification() as any, makeMessageWithThresholds());
			expect(postedJson().body).toContain("CPU");
		});

		it("includes incident links in the body", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeAppriseNotification() as any, makeMessageWithIncident());
			expect(postedJson().body).toContain("/infrastructure/mon-1");
		});
	});
});
