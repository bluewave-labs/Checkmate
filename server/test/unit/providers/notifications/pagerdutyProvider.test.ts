import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { createMockLogger } from "../../../helpers/createMockLogger.ts";
import { makeNotification, makeMessage, makeMessageWithThresholds } from "../../../helpers/notificationMessage.ts";
import { testNotificationProviderContract } from "../../../helpers/notificationProviderContract.ts";

const mockGotPost = jest.fn().mockResolvedValue({});
jest.unstable_mockModule("got", () => ({ default: { post: mockGotPost } }));

const { PagerDutyProvider } = await import("../../../../src/service/infrastructure/notificationProviders/pagerduty.ts");

const createProvider = () => {
	const logger = createMockLogger();
	return { provider: new PagerDutyProvider(logger as any), logger };
};

testNotificationProviderContract("PagerDutyProvider", {
	create: () => {
		mockGotPost.mockResolvedValue({});
		return createProvider().provider;
	},
	makeNotification: () => makeNotification(),
});

describe("PagerDutyProvider", () => {
	beforeEach(() => mockGotPost.mockReset().mockResolvedValue({}));

	describe("sendTestAlert", () => {
		it("sends to PagerDuty API and returns true", async () => {
			expect(await createProvider().provider.sendTestAlert(makeNotification())).toBe(true);
			expect(mockGotPost).toHaveBeenCalledWith(
				"https://events.pagerduty.com/v2/enqueue",
				expect.objectContaining({
					json: expect.objectContaining({ routing_key: "https://hooks.example.com/webhook", event_action: "trigger" }),
				})
			);
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
		it("sends payload and returns true", async () => {
			const { provider } = createProvider();
			expect(await provider.sendMessage(makeNotification() as any, makeMessage())).toBe(true);
			const payload = mockGotPost.mock.calls[0][1].json;
			expect(payload.routing_key).toBe("https://hooks.example.com/webhook");
			expect(payload.event_action).toBe("trigger");
			expect(payload.dedup_key).toBe("checkmate-mon-1");
		});

		it("returns false when address is missing", async () => {
			const { provider } = createProvider();
			expect(await provider.sendMessage(makeNotification({ address: "" }) as any, makeMessage())).toBe(false);
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

		it("uses 'resolve' event_action for monitor_up", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeNotification() as any, makeMessage({ type: "monitor_up" }));
			expect(mockGotPost.mock.calls[0][1].json.event_action).toBe("resolve");
		});

		it("uses 'resolve' event_action for threshold_resolved", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeNotification() as any, makeMessage({ type: "threshold_resolved" }));
			expect(mockGotPost.mock.calls[0][1].json.event_action).toBe("resolve");
		});

		it("includes threshold info in summary and custom_details", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeNotification() as any, makeMessageWithThresholds());
			const payload = mockGotPost.mock.calls[0][1].json;
			expect(payload.payload.summary).toContain("CPU");
			expect(payload.payload.custom_details.threshold_breaches).toBeDefined();
		});

		it("includes details in custom_details", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeNotification() as any, makeMessage());
			expect(mockGotPost.mock.calls[0][1].json.payload.custom_details.details).toBeDefined();
		});

		it("maps all severity levels", async () => {
			const { provider } = createProvider();
			for (const severity of ["critical", "warning", "info", "success"] as const) {
				mockGotPost.mockClear();
				await provider.sendMessage(makeNotification() as any, makeMessage({ severity }));
				expect(mockGotPost.mock.calls[0][1].json.payload.severity).toBeTruthy();
			}
		});

		it("uses 'error' for unknown severity", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeNotification() as any, makeMessage({ severity: "unknown" as any }));
			expect(mockGotPost.mock.calls[0][1].json.payload.severity).toBe("error");
		});

		it("omits threshold and details from custom_details when not present", async () => {
			const { provider } = createProvider();
			const msg = makeMessage();
			msg.content.thresholds = undefined;
			msg.content.details = undefined;
			await provider.sendMessage(makeNotification() as any, msg);
			const cd = mockGotPost.mock.calls[0][1].json.payload.custom_details;
			expect(cd.threshold_breaches).toBeUndefined();
			expect(cd.details).toBeUndefined();
		});
	});
});
