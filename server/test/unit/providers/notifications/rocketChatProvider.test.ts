import { describe, expect, it, jest } from "@jest/globals";
import { createMockLogger } from "../../../helpers/createMockLogger.ts";
import { makeMessage, makeMessageWithIncident, makeMessageWithThresholds, makeNotification } from "../../../helpers/notificationMessage.ts";
import { testNotificationProviderContract } from "../../../helpers/notificationProviderContract.ts";

const mockGotPost = jest.fn().mockResolvedValue({});
jest.unstable_mockModule("got", () => ({ default: { post: mockGotPost } }));

const { RocketChatProvider } = await import("../../../../src/domain/notifications/providers/rocketChat.ts");

const createProvider = () => {
	const logger = createMockLogger();
	const provider = new RocketChatProvider(logger as any);
	return { provider, logger };
};

testNotificationProviderContract("RocketChatProvider", {
	create: () => {
		mockGotPost.mockResolvedValue({});
		return createProvider().provider;
	},
	makeNotification: () => makeNotification({ type: "rocket_chat" }),
});

describe("RocketChatProvider", () => {
	beforeEach(() => mockGotPost.mockReset().mockResolvedValue({}));

	it("sends a text-only test alert", async () => {
		const { provider } = createProvider();

		const result = await provider.sendTestAlert(makeNotification({ type: "rocket_chat" }));

		expect(result).toBe(true);
		expect(mockGotPost).toHaveBeenCalledWith(
			"https://hooks.example.com/webhook",
			expect.objectContaining({
				json: { text: "This is a test notification from Checkmate" },
				timeout: { request: 30000 },
				retry: { limit: 0 },
			})
		);
	});

	it("returns false when the test webhook URL is missing", async () => {
		const { provider } = createProvider();

		const result = await provider.sendTestAlert(makeNotification({ type: "rocket_chat", address: "" }));

		expect(result).toBe(false);
		expect(mockGotPost).not.toHaveBeenCalled();
	});

	it("returns false and logs when test delivery fails", async () => {
		mockGotPost.mockRejectedValue(new Error("network failure"));
		const { provider, logger } = createProvider();

		const result = await provider.sendTestAlert(makeNotification({ type: "rocket_chat" }));

		expect(result).toBe(false);
		expect(logger.warn).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "Rocket.Chat test alert failed",
				service: "RocketChatProvider",
				method: "sendTestAlert",
			})
		);
	});

	it("sends monitor details as a text-only message", async () => {
		const { provider } = createProvider();

		const result = await provider.sendMessage(makeNotification({ type: "rocket_chat" }), makeMessage());

		expect(result).toBe(true);
		expect(mockGotPost).toHaveBeenCalledWith(
			"https://hooks.example.com/webhook",
			expect.objectContaining({
				timeout: { request: 30000 },
				retry: { limit: 0 },
				json: {
					text: [
						"Monitor Down: Test Monitor",
						'Monitor "Test Monitor" is currently down.',
						"",
						"Monitor: Test Monitor",
						"Type: http",
						"Status: down",
						"URL: https://example.com",
						"",
						"Details:",
						"- URL: https://example.com",
						"- Status: Down",
					].join("\n"),
				},
			})
		);
	});

	it("returns false when the message webhook URL is missing", async () => {
		const { provider } = createProvider();

		const result = await provider.sendMessage(makeNotification({ type: "rocket_chat", address: "" }), makeMessage());

		expect(result).toBe(false);
		expect(mockGotPost).not.toHaveBeenCalled();
	});

	it("includes threshold breaches in the text", async () => {
		const { provider } = createProvider();

		await provider.sendMessage(makeNotification({ type: "rocket_chat" }), makeMessageWithThresholds());

		const payload = mockGotPost.mock.calls[0][1].json;
		expect(payload.text).toContain("Thresholds:\n- CPU: 90.0% (threshold: 80%)\n- MEMORY: 85.0% (threshold: 70%)");
	});

	it("includes a monitor-scoped link when incident data is present", async () => {
		const { provider } = createProvider();

		await provider.sendMessage(makeNotification({ type: "rocket_chat" }), makeMessageWithIncident());

		const payload = mockGotPost.mock.calls[0][1].json;
		expect(payload.text).toContain("Incident: https://app.example.com/infrastructure/mon-1");
	});

	it("omits the incident link when incident data is absent", async () => {
		const { provider } = createProvider();

		await provider.sendMessage(
			makeNotification({ type: "rocket_chat" }),
			makeMessage({
				type: "monitor_up",
				severity: "success",
				monitor: { id: "mon-1", name: "Test Monitor", url: "https://example.com", type: "http", status: "up" },
			})
		);

		const payload = mockGotPost.mock.calls[0][1].json;
		expect(payload.text).not.toContain("Incident:");
	});

	it("returns false and logs when message delivery fails", async () => {
		mockGotPost.mockRejectedValue(new Error("network failure"));
		const { provider, logger } = createProvider();

		const result = await provider.sendMessage(makeNotification({ type: "rocket_chat" }), makeMessage());

		expect(result).toBe(false);
		expect(logger.warn).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "Rocket.Chat notification failed",
				service: "RocketChatProvider",
				method: "sendMessage",
			})
		);
	});
});
