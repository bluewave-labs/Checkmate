import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import type { Notification } from "../../../../src/types/notification.ts";
import type { NotificationMessage } from "../../../../src/types/notificationMessage.ts";
import { createMockLogger } from "../../../helpers/createMockLogger.ts";

const mockPost = jest.fn();
jest.unstable_mockModule("got", () => ({
	default: { post: mockPost },
	HTTPError: class HTTPError extends Error {},
}));

const { TeamsProvider } = await import("../../../../src/service/infrastructure/notificationProviders/teams.ts");

const createNotification = (overrides?: Partial<Notification>): Notification => ({
	id: "notif-1",
	userId: "user-1",
	teamId: "team-1",
	type: "teams",
	notificationName: "Teams Alert",
	address: "https://xxxxx.webhook.office.com/webhookb2/test",
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
	...overrides,
});

const createMessage = (overrides?: Partial<NotificationMessage>): NotificationMessage => ({
	type: "monitor_down",
	severity: "critical",
	monitor: {
		id: "mon-1",
		name: "API Server",
		url: "https://api.example.com",
		type: "http",
		status: "down",
	},
	content: {
		title: "🔴 Monitor Down",
		summary: "API Server is not responding",
		details: ["Response timeout after 30s"],
		thresholds: [],
		incident: {
			id: "inc-1",
			url: "https://app.example.com/incidents/inc-1",
			createdAt: new Date(),
		},
		timestamp: new Date("2026-01-15T12:00:00Z"),
	},
	clientHost: "https://app.example.com",
	metadata: {
		teamId: "team-1",
		notificationReason: "monitor_down",
	},
	...overrides,
});

describe("TeamsProvider", () => {
	let provider: InstanceType<typeof TeamsProvider>;
	let logger: ReturnType<typeof createMockLogger>;

	beforeEach(() => {
		logger = createMockLogger();
		provider = new TeamsProvider(logger);
		mockPost.mockReset();
		mockPost.mockResolvedValue({});
	});

	describe("sendTestAlert", () => {
		it("returns false when address is missing", async () => {
			const notification = createNotification({ address: undefined });
			const result = await provider.sendTestAlert(notification);
			expect(result).toBe(false);
			expect(mockPost).not.toHaveBeenCalled();
		});

		it("sends an Adaptive Card test message and returns true on success", async () => {
			const notification = createNotification();
			const result = await provider.sendTestAlert(notification);
			expect(result).toBe(true);
			expect(mockPost).toHaveBeenCalledTimes(1);

			const [url, options] = mockPost.mock.calls[0] as [string, { json: any; headers: any }];
			expect(url).toBe(notification.address);
			expect(options.headers["Content-Type"]).toBe("application/json");

			const payload = options.json;
			expect(payload.type).toBe("message");
			expect(payload.attachments).toHaveLength(1);
			expect(payload.attachments[0].contentType).toBe("application/vnd.microsoft.card.adaptive");

			const card = payload.attachments[0].content;
			expect(card.type).toBe("AdaptiveCard");
			expect(card.version).toBe("1.4");
			expect(card.body[0].type).toBe("TextBlock");
			expect(card.body[0].text).toBe("This is a test notification from Checkmate");
		});

		it("returns false and logs warning on HTTP error", async () => {
			mockPost.mockRejectedValue(new Error("Network error"));
			const notification = createNotification();
			const result = await provider.sendTestAlert(notification);
			expect(result).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Teams test alert failed",
					service: "TeamsProvider",
				})
			);
		});
	});

	describe("sendMessage", () => {
		it("returns false when address is missing", async () => {
			const notification = createNotification({ address: undefined });
			const result = await provider.sendMessage(notification, createMessage());
			expect(result).toBe(false);
			expect(mockPost).not.toHaveBeenCalled();
		});

		it("sends a well-formed Adaptive Card and returns true", async () => {
			const notification = createNotification();
			const message = createMessage();
			const result = await provider.sendMessage(notification, message);

			expect(result).toBe(true);
			expect(mockPost).toHaveBeenCalledTimes(1);

			const [url, options] = mockPost.mock.calls[0] as [string, { json: any }];
			expect(url).toBe(notification.address);

			const payload = options.json;
			expect(payload.type).toBe("message");

			const card = payload.attachments[0].content;
			expect(card.type).toBe("AdaptiveCard");
			expect(card.version).toBe("1.4");

			const textBlocks = card.body.filter((b: any) => b.type === "TextBlock");
			const factSets = card.body.filter((b: any) => b.type === "FactSet");

			expect(textBlocks[0].text).toBe(message.content.title);
			expect(textBlocks[0].color).toBe("attention");
			expect(textBlocks[1].text).toBe(message.content.summary);

			expect(factSets).toHaveLength(1);
			const facts = factSets[0].facts;
			expect(facts).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ title: "Name", value: "API Server" }),
					expect.objectContaining({ title: "URL", value: "https://api.example.com" }),
					expect.objectContaining({ title: "Status", value: "down" }),
				])
			);

			expect(card.actions).toHaveLength(1);
			expect(card.actions[0].type).toBe("Action.OpenUrl");
			expect(card.actions[0].title).toBe("View Incident");
			expect(card.actions[0].url).toContain("/incidents/inc-1");
		});

		it("omits actions when no incident is present", async () => {
			const notification = createNotification();
			const message = createMessage({
				content: {
					title: "Test",
					summary: "Summary",
					timestamp: new Date(),
				},
			});
			const result = await provider.sendMessage(notification, message);
			expect(result).toBe(true);

			const [, options] = mockPost.mock.calls[0] as [string, { json: any }];
			const card = options.json.attachments[0].content;
			expect(card.actions).toBeUndefined();
		});

		it("includes threshold breaches when present", async () => {
			const notification = createNotification();
			const message = createMessage({
				type: "threshold_breach",
				severity: "warning",
				content: {
					title: "Threshold Breach",
					summary: "CPU usage exceeded",
					thresholds: [
						{
							metric: "cpu",
							currentValue: 95,
							threshold: 80,
							unit: "%",
							formattedValue: "95%",
						},
					],
					timestamp: new Date(),
				},
			});

			await provider.sendMessage(notification, message);

			const [, options] = mockPost.mock.calls[0] as [string, { json: any }];
			const card = options.json.attachments[0].content;

			// Title should use "warning" color
			expect(card.body[0].color).toBe("warning");

			// Find threshold text blocks
			const thresholdHeader = card.body.find((b: any) => b.type === "TextBlock" && b.text === "**Threshold Breaches**");
			expect(thresholdHeader).toBeDefined();

			const cpuBlock = card.body.find((b: any) => b.type === "TextBlock" && b.text?.includes("**CPU**"));
			expect(cpuBlock).toBeDefined();
			expect(cpuBlock.text).toContain("95%");
			expect(cpuBlock.text).toContain("threshold: 80%");
		});

		it("maps severity to correct Adaptive Card colors", async () => {
			const notification = createNotification();

			const severityMap = [
				{ severity: "critical", expected: "attention" },
				{ severity: "warning", expected: "warning" },
				{ severity: "success", expected: "good" },
				{ severity: "info", expected: "accent" },
			] as const;

			for (const { severity, expected } of severityMap) {
				mockPost.mockReset();
				mockPost.mockResolvedValue({});

				const message = createMessage({ severity });
				await provider.sendMessage(notification, message);

				const [, options] = mockPost.mock.calls[0] as [string, { json: any }];
				const card = options.json.attachments[0].content;
				expect(card.body[0].color).toBe(expected);
			}
		});

		it("returns false and logs warning on HTTP error", async () => {
			mockPost.mockRejectedValue(new Error("502 Bad Gateway"));
			const notification = createNotification();
			const result = await provider.sendMessage(notification, createMessage());
			expect(result).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Teams alert failed via sendMessage",
					service: "TeamsProvider",
				})
			);
		});

		it("handles non-Error thrown values in sendMessage", async () => {
			mockPost.mockRejectedValue(null);
			const result = await provider.sendMessage(createNotification(), createMessage());
			expect(result).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ stack: undefined }));
		});

		it("includes details section in Adaptive Card when details are present", async () => {
			const notification = createNotification();
			const message = createMessage({
				content: {
					title: "Test",
					summary: "Summary",
					details: ["URL: https://example.com", "Status: Down"],
					timestamp: new Date(),
				},
			});
			await provider.sendMessage(notification, message);
			const [, options] = mockPost.mock.calls[0] as [string, { json: any }];
			const card = options.json.attachments[0].content;
			const text = JSON.stringify(card.body);
			expect(text).toContain("Additional Information");
			expect(text).toContain("URL: https://example.com");
		});

		it("uses default color for unknown severity", async () => {
			const notification = createNotification();
			const message = createMessage({ severity: "unknown" as any });
			await provider.sendMessage(notification, message);
			const [, options] = mockPost.mock.calls[0] as [string, { json: any }];
			const card = options.json.attachments[0].content;
			expect(card.body[0].color).toBe("default");
		});
	});

	describe("sendTestAlert error handling", () => {
		it("handles non-Error thrown values", async () => {
			mockPost.mockRejectedValue(null);
			const result = await provider.sendTestAlert(createNotification());
			expect(result).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ stack: undefined }));
		});
	});
});
