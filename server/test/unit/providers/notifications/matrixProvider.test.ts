import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { createMockLogger } from "../../../helpers/createMockLogger.ts";
import { makeNotification, makeMessage, makeMessageWithThresholds, makeMessageWithIncident } from "../../../helpers/notificationMessage.ts";
import { testNotificationProviderContract } from "../../../helpers/notificationProviderContract.ts";

const mockGotPut = jest.fn().mockResolvedValue({});
jest.unstable_mockModule("got", () => ({ default: { put: mockGotPut } }));
jest.unstable_mockModule("crypto", () => ({ randomUUID: () => "test-uuid-1234" }));

const { MatrixProvider } = await import("../../../../src/service/infrastructure/notificationProviders/matrix.ts");

const createProvider = () => {
	const logger = createMockLogger();
	return { provider: new MatrixProvider(logger as any), logger };
};

testNotificationProviderContract("MatrixProvider", {
	create: () => {
		mockGotPut.mockResolvedValue({});
		return createProvider().provider;
	},
	makeNotification: () => makeNotification(),
});

describe("MatrixProvider", () => {
	beforeEach(() => mockGotPut.mockReset().mockResolvedValue({}));

	describe("sendTestAlert", () => {
		it("sends to Matrix API and returns true", async () => {
			expect(await createProvider().provider.sendTestAlert(makeNotification())).toBe(true);
			expect(mockGotPut).toHaveBeenCalledWith(
				expect.stringContaining("matrix.example.com/_matrix/client/v3/rooms/!room:example.com/send/m.room.message/test-uuid-1234"),
				expect.objectContaining({
					headers: expect.objectContaining({ Authorization: "Bearer token-abc" }),
				})
			);
		});

		it("returns false when homeserverUrl is missing", async () => {
			expect(await createProvider().provider.sendTestAlert(makeNotification({ homeserverUrl: undefined }))).toBe(false);
		});

		it("returns false when accessToken is missing", async () => {
			expect(await createProvider().provider.sendTestAlert(makeNotification({ accessToken: undefined }))).toBe(false);
		});

		it("returns false when roomId is missing", async () => {
			expect(await createProvider().provider.sendTestAlert(makeNotification({ roomId: undefined }))).toBe(false);
		});

		it("returns false and logs on error", async () => {
			mockGotPut.mockRejectedValue(new Error("fail"));
			const { provider, logger } = createProvider();
			expect(await provider.sendTestAlert(makeNotification())).toBe(false);
			expect(logger.warn).toHaveBeenCalled();
		});

		it("handles non-Error thrown values", async () => {
			mockGotPut.mockRejectedValue({ message: "custom obj" });
			const { provider, logger } = createProvider();
			expect(await provider.sendTestAlert(makeNotification())).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ stack: undefined }));
		});
	});

	describe("sendMessage", () => {
		it("sends formatted HTML and plain text", async () => {
			const { provider } = createProvider();
			expect(await provider.sendMessage(makeNotification() as any, makeMessage())).toBe(true);
			const body = mockGotPut.mock.calls[0][1].json;
			expect(body.msgtype).toBe("m.text");
			expect(body.format).toBe("org.matrix.custom.html");
			expect(body.body).toContain("Monitor Down");
			expect(body.formatted_body).toContain("<h2");
		});

		it("returns false when homeserverUrl is missing", async () => {
			expect(await createProvider().provider.sendMessage(makeNotification({ homeserverUrl: undefined }) as any, makeMessage())).toBe(false);
		});

		it("returns false and logs on error", async () => {
			mockGotPut.mockRejectedValue(new Error("fail"));
			const { provider, logger } = createProvider();
			expect(await provider.sendMessage(makeNotification() as any, makeMessage())).toBe(false);
			expect(logger.warn).toHaveBeenCalled();
		});

		it("includes threshold breaches", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeNotification() as any, makeMessageWithThresholds());
			const body = mockGotPut.mock.calls[0][1].json;
			expect(body.body).toContain("CPU");
			expect(body.formatted_body).toContain("CPU");
		});

		it("includes incident link", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeNotification() as any, makeMessageWithIncident());
			const body = mockGotPut.mock.calls[0][1].json;
			expect(body.body).toContain("View Incident");
			expect(body.formatted_body).toContain("View Incident");
		});

		it("omits optional sections when not present", async () => {
			const { provider } = createProvider();
			const msg = makeMessage();
			msg.content.thresholds = undefined;
			msg.content.details = undefined;
			msg.content.incident = undefined;
			await provider.sendMessage(makeNotification() as any, msg);
			const body = mockGotPut.mock.calls[0][1].json;
			expect(body.body).not.toContain("Threshold");
			expect(body.body).not.toContain("Additional");
			expect(body.body).not.toContain("View Incident");
		});

		it("escapes HTML special characters", async () => {
			const { provider } = createProvider();
			const msg = makeMessage();
			msg.monitor.name = '<script>alert("xss")</script>';
			await provider.sendMessage(makeNotification() as any, msg);
			const html = mockGotPut.mock.calls[0][1].json.formatted_body;
			expect(html).not.toContain("<script>");
			expect(html).toContain("&lt;script&gt;");
		});

		it("maps all severity levels to colors", async () => {
			const { provider } = createProvider();
			for (const severity of ["critical", "warning", "success", "info"] as const) {
				mockGotPut.mockClear();
				await provider.sendMessage(makeNotification() as any, makeMessage({ severity }));
				const html = mockGotPut.mock.calls[0][1].json.formatted_body;
				expect(html).toContain("color:");
			}
		});

		it("uses default color for unknown severity", async () => {
			const { provider } = createProvider();
			await provider.sendMessage(makeNotification() as any, makeMessage({ severity: "unknown" as any }));
			const html = mockGotPut.mock.calls[0][1].json.formatted_body;
			expect(html).toContain("#808080");
		});
	});
});
