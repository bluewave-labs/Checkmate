import { describe, expect, it, jest } from "@jest/globals";
import type { NotificationSeverity } from "../../../../src/domain/notifications/notification.type.ts";
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

	it("sends a rich test alert without webhook overrides", async () => {
		const { provider } = createProvider();

		const result = await provider.sendTestAlert(makeNotification({ type: "rocket_chat" }));

		expect(result).toBe(true);
		expect(mockGotPost).toHaveBeenCalledWith(
			"https://hooks.example.com/webhook",
			expect.objectContaining({
				json: {
					text: "This is a test notification from Checkmate",
					attachments: [
						{
							color: "#0000FF",
							title: "Checkmate test notification",
							fields: [
								{ title: "Channel", value: "Rocket.Chat", short: true },
								{ title: "Status", value: "Test notification", short: true },
							],
						},
					],
				},
				timeout: { request: 30000 },
				retry: { limit: 0 },
			})
		);

		const payload = mockGotPost.mock.calls[0][1].json;
		expect(payload).not.toHaveProperty("alias");
		expect(payload).not.toHaveProperty("avatar");
		expect(payload).not.toHaveProperty("emoji");
		expect(payload).not.toHaveProperty("channel");
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

	it("sends a rich monitor attachment without webhook overrides", async () => {
		const { provider } = createProvider();

		const result = await provider.sendMessage(makeNotification({ type: "rocket_chat" }), makeMessage());

		expect(result).toBe(true);
		expect(mockGotPost).toHaveBeenCalledWith(
			"https://hooks.example.com/webhook",
			expect.objectContaining({
				timeout: { request: 30000 },
				retry: { limit: 0 },
				json: {
					text: 'Monitor "Test Monitor" is currently down.',
					attachments: [
						{
							color: "#FF0000",
							title: "Monitor Down: Test Monitor",
							title_link: "https://app.example.com/infrastructure/mon-1",
							fields: [
								{ title: "Monitor", value: "Test Monitor", short: true },
								{ title: "Type", value: "http", short: true },
								{ title: "Status", value: "down", short: true },
								{ title: "URL", value: "https://example.com", short: false },
								{
									title: "Details",
									value: "- URL: https://example.com\n- Status: Down",
									short: false,
								},
							],
							ts: "2025-01-01T00:00:00.000Z",
						},
					],
				},
			})
		);

		const payload = mockGotPost.mock.calls[0][1].json;
		expect(payload).not.toHaveProperty("alias");
		expect(payload).not.toHaveProperty("avatar");
		expect(payload).not.toHaveProperty("emoji");
		expect(payload).not.toHaveProperty("channel");
	});

	it.each([
		["critical", "#FF0000"],
		["warning", "#FFA500"],
		["success", "#00FF00"],
		["info", "#0000FF"],
		["unknown", "#808080"],
	])("maps %s severity to %s", async (severity, color) => {
		const { provider } = createProvider();

		await provider.sendMessage(makeNotification({ type: "rocket_chat" }), makeMessage({ severity: severity as NotificationSeverity }));

		const payload = mockGotPost.mock.calls[0][1].json;
		expect(payload.attachments[0].color).toBe(color);
	});

	it("appends threshold fields before details", async () => {
		const { provider } = createProvider();

		await provider.sendMessage(makeNotification({ type: "rocket_chat" }), makeMessageWithThresholds());

		const fields = mockGotPost.mock.calls[0][1].json.attachments[0].fields;
		expect(fields).toEqual([
			{ title: "Monitor", value: "Infra Server", short: true },
			{ title: "Type", value: "hardware", short: true },
			{ title: "Status", value: "up", short: true },
			{ title: "URL", value: "https://infra.example.com", short: false },
			{ title: "CPU", value: "90.0% (threshold: 80%)", short: true },
			{ title: "MEMORY", value: "85.0% (threshold: 70%)", short: true },
			{ title: "Details", value: "- URL: https://infra.example.com", short: false },
		]);
	});

	it("appends the incident URL after details", async () => {
		const { provider } = createProvider();

		await provider.sendMessage(makeNotification({ type: "rocket_chat" }), makeMessageWithIncident());

		const fields = mockGotPost.mock.calls[0][1].json.attachments[0].fields;
		expect(fields).toEqual([
			{ title: "Monitor", value: "Test Monitor", short: true },
			{ title: "Type", value: "http", short: true },
			{ title: "Status", value: "down", short: true },
			{ title: "URL", value: "https://example.com", short: false },
			{ title: "Details", value: "- URL: https://example.com\n- Status: Down", short: false },
			{ title: "Incident", value: "https://app.example.com/incidents/inc-1", short: false },
		]);
	});

	it("omits empty optional fields", async () => {
		const { provider } = createProvider();
		const message = makeMessage();

		await provider.sendMessage(
			makeNotification({ type: "rocket_chat" }),
			makeMessage({
				content: {
					...message.content,
					details: [],
					thresholds: [],
					incident: undefined,
				},
			})
		);

		const fields = mockGotPost.mock.calls[0][1].json.attachments[0].fields;
		expect(fields).toEqual([
			{ title: "Monitor", value: "Test Monitor", short: true },
			{ title: "Type", value: "http", short: true },
			{ title: "Status", value: "down", short: true },
			{ title: "URL", value: "https://example.com", short: false },
		]);
	});

	it("returns false when the message webhook URL is missing", async () => {
		const { provider } = createProvider();

		const result = await provider.sendMessage(makeNotification({ type: "rocket_chat", address: "" }), makeMessage());

		expect(result).toBe(false);
		expect(mockGotPost).not.toHaveBeenCalled();
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
