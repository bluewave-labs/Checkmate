import { describe, expect, it, jest } from "@jest/globals";
import { NetworkService } from "../../../src/service/infrastructure/networkService.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import { NETWORK_ERROR } from "../../../src/service/infrastructure/network/utils.ts";
import type { IStatusProvider } from "../../../src/service/infrastructure/network/IStatusProvider.ts";
import type { Monitor, MonitorType } from "../../../src/types/index.ts";
import type { AxiosStatic } from "axios";

// ── Helpers ──────────────────────────────────────────────────────────────────

const createMockAxios = () =>
	({
		post: jest.fn(),
	}) as unknown as jest.Mocked<AxiosStatic>;

const createMockProvider = (type: string, result?: unknown) => {
	const provider: jest.Mocked<IStatusProvider<unknown>> = {
		type,
		supports: jest.fn((t: MonitorType) => t === type) as any,
		handle: jest.fn().mockResolvedValue(
			result ?? {
				monitorId: "mon-1",
				teamId: "team-1",
				type,
				status: true,
				code: 200,
				message: "OK",
			}
		),
	};
	return provider;
};

const createService = (providers: IStatusProvider<unknown>[] = []) => {
	const logger = createMockLogger();
	const axios = createMockAxios();
	const service = new NetworkService(axios, logger as any, providers);
	return { service, logger, axios };
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("NetworkService", () => {
	// ── Static / instance properties ─────────────────────────────────────────

	describe("serviceName", () => {
		it("returns NetworkService from static property", () => {
			expect(NetworkService.SERVICE_NAME).toBe("NetworkService");
		});

		it("returns NetworkService from instance getter", () => {
			const { service } = createService();
			expect(service.serviceName).toBe("NetworkService");
		});
	});

	// ── requestStatus ────────────────────────────────────────────────────────

	describe("requestStatus", () => {
		it("delegates to the matching provider", async () => {
			const provider = createMockProvider("http");
			const { service } = createService([provider]);
			const monitor = { type: "http", _id: "mon-1" } as unknown as Monitor & { type: "http" };

			const result = await service.requestStatus(monitor);

			expect(provider.supports).toHaveBeenCalledWith("http");
			expect(provider.handle).toHaveBeenCalledWith(monitor);
			expect(result).toEqual(
				expect.objectContaining({
					monitorId: "mon-1",
					status: true,
					code: 200,
				})
			);
		});

		it("selects the correct provider when multiple are registered", async () => {
			const httpProvider = createMockProvider("http");
			const pingProvider = createMockProvider("ping");
			const { service } = createService([httpProvider, pingProvider]);
			const monitor = { type: "ping", _id: "mon-2" } as unknown as Monitor & { type: "ping" };

			await service.requestStatus(monitor);

			expect(httpProvider.handle).not.toHaveBeenCalled();
			expect(pingProvider.handle).toHaveBeenCalledWith(monitor);
		});

		it("returns unsupported-type response when no provider matches", async () => {
			const { service } = createService([]);
			const monitor = { type: "unknown_type" as any, _id: "mon-1" } as unknown as Monitor & { type: any };

			const result = await service.requestStatus(monitor);

			expect(result).toEqual({
				monitorId: "unknown",
				teamId: "unknown",
				type: "unknown",
				status: false,
				code: NETWORK_ERROR,
				message: "Unsupported type: unknown_type",
			});
		});
	});

	// ── requestWebhook ───────────────────────────────────────────────────────

	describe("requestWebhook", () => {
		it("sends a POST and returns success response", async () => {
			const { service, axios } = createService();
			(axios.post as jest.Mock).mockResolvedValue({ status: 200, data: { ok: true } });

			const result = await service.requestWebhook("slack", "https://hooks.example.com", { text: "hello" });

			expect(axios.post).toHaveBeenCalledWith("https://hooks.example.com", { text: "hello" }, { headers: { "Content-Type": "application/json" } });
			expect(result).toEqual({
				type: "webhook",
				status: true,
				code: 200,
				message: "Successfully sent slack notification",
				payload: { ok: true },
			});
		});

		it("returns failure with response data on axios error with response", async () => {
			const { service, axios, logger } = createService();
			const axiosError = Object.assign(new Error("Request failed"), {
				response: { status: 403, data: { error: "forbidden" } },
			});
			(axios.post as jest.Mock).mockRejectedValue(axiosError);

			const result = await service.requestWebhook("discord", "https://hooks.example.com", {});

			expect(result).toEqual({
				type: "webhook",
				status: false,
				code: 403,
				message: "Failed to send discord notification",
				payload: { error: "forbidden" },
			});
			expect(logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Request failed",
					service: "NetworkService",
					method: "requestWebhook",
				})
			);
		});

		it("returns failure with NETWORK_ERROR when axios error has no response status", async () => {
			const { service, axios } = createService();
			const axiosError = Object.assign(new Error("timeout"), {
				response: { status: undefined, data: undefined },
			});
			(axios.post as jest.Mock).mockRejectedValue(axiosError);

			const result = await service.requestWebhook("slack", "https://hooks.example.com", {});

			expect(result.code).toBe(NETWORK_ERROR);
		});

		it("returns failure with NETWORK_ERROR on non-axios error (no response property)", async () => {
			const { service, axios } = createService();
			(axios.post as jest.Mock).mockRejectedValue(new Error("DNS failure"));

			const result = await service.requestWebhook("slack", "https://hooks.example.com", {});

			expect(result).toEqual({
				type: "webhook",
				status: false,
				code: NETWORK_ERROR,
				message: "Failed to send slack notification",
			});
		});

		it("handles non-Error thrown values", async () => {
			const { service, axios, logger } = createService();
			(axios.post as jest.Mock).mockRejectedValue("string error");

			const result = await service.requestWebhook("slack", "https://hooks.example.com", {});

			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: "string error" }));
			expect(result).toEqual({
				type: "webhook",
				status: false,
				code: NETWORK_ERROR,
				message: "Failed to send slack notification",
			});
		});

		it("returns NETWORK_ERROR when error has response key but response is undefined", async () => {
			const { service, axios } = createService();
			const axiosError = Object.assign(new Error("fail"), { response: undefined });
			(axios.post as jest.Mock).mockRejectedValue(axiosError);

			const result = await service.requestWebhook("slack", "https://hooks.example.com", {});

			expect(result.code).toBe(NETWORK_ERROR);
			expect(result.payload).toBeUndefined();
		});
	});

	// ── requestPagerDuty ─────────────────────────────────────────────────────

	describe("requestPagerDuty", () => {
		const args = {
			message: "Server down",
			routingKey: "routing-key-123",
			monitorUrl: "https://monitor.example.com",
		};

		it("sends correct payload and returns true on success", async () => {
			const { service, axios } = createService();
			(axios.post as jest.Mock).mockResolvedValue({ data: { status: "success" } });

			const result = await service.requestPagerDuty(args);

			expect(result).toBe(true);
			expect(axios.post).toHaveBeenCalledWith(
				"https://events.pagerduty.com/v2/enqueue",
				expect.objectContaining({
					routing_key: "routing-key-123",
					event_action: "trigger",
					payload: expect.objectContaining({
						summary: "Server down",
						severity: "critical",
						source: "https://monitor.example.com",
					}),
				})
			);
		});

		it("returns false when response status is not success", async () => {
			const { service, axios } = createService();
			(axios.post as jest.Mock).mockResolvedValue({ data: { status: "invalid event" } });

			const result = await service.requestPagerDuty(args);

			expect(result).toBe(false);
		});

		it("returns false when response data is undefined", async () => {
			const { service, axios } = createService();
			(axios.post as jest.Mock).mockResolvedValue({ data: undefined });

			const result = await service.requestPagerDuty(args);

			expect(result).toBe(false);
		});

		it("throws AppError on axios failure with response data", async () => {
			const { service, axios } = createService();
			const axiosError = Object.assign(new Error("Request failed"), {
				response: { data: { message: "invalid routing key" } },
			});
			(axios.post as jest.Mock).mockRejectedValue(axiosError);

			await expect(service.requestPagerDuty(args)).rejects.toThrow("Request failed");
		});

		it("throws AppError on network error without response", async () => {
			const { service, axios } = createService();
			(axios.post as jest.Mock).mockRejectedValue(new Error("ECONNREFUSED"));

			await expect(service.requestPagerDuty(args)).rejects.toThrow("ECONNREFUSED");
		});

		it("throws AppError with default message for non-Error thrown value", async () => {
			const { service, axios } = createService();
			(axios.post as jest.Mock).mockRejectedValue(null);

			await expect(service.requestPagerDuty(args)).rejects.toThrow("null");
		});

		it("uses fallback message when Error has empty string message", async () => {
			const { service, axios } = createService();
			(axios.post as jest.Mock).mockRejectedValue(new Error(""));

			try {
				await service.requestPagerDuty(args);
				expect.unreachable("should have thrown");
			} catch (err: any) {
				expect(err.message).toBe("Error sending PagerDuty notification");
			}
		});

		it("includes responseData when non-Error object has response property", async () => {
			const { service, axios } = createService();
			const errorObj = { response: { data: { detail: "bad key" } } };
			(axios.post as jest.Mock).mockRejectedValue(errorObj);

			try {
				await service.requestPagerDuty(args);
				expect.unreachable("should have thrown");
			} catch (err: any) {
				expect(err.details).toEqual({ responseData: { detail: "bad key" } });
			}
		});

		it("sets responseData to undefined when error is a primitive (non-object)", async () => {
			const { service, axios } = createService();
			(axios.post as jest.Mock).mockRejectedValue(42);

			try {
				await service.requestPagerDuty(args);
				expect.unreachable("should have thrown");
			} catch (err: any) {
				expect(err.details).toEqual({ responseData: undefined });
			}
		});

		it("sets responseData to undefined when object has response key set to undefined", async () => {
			const { service, axios } = createService();
			(axios.post as jest.Mock).mockRejectedValue({ response: undefined });

			try {
				await service.requestPagerDuty(args);
				expect.unreachable("should have thrown");
			} catch (err: any) {
				expect(err.details).toEqual({ responseData: undefined });
			}
		});

		it("includes responseData in AppError details when available", async () => {
			const { service, axios } = createService();
			const axiosError = Object.assign(new Error("Bad request"), {
				response: { data: { errors: ["invalid key"] } },
			});
			(axios.post as jest.Mock).mockRejectedValue(axiosError);

			try {
				await service.requestPagerDuty(args);
				expect.unreachable("should have thrown");
			} catch (err: any) {
				expect(err.details).toEqual({
					responseData: { errors: ["invalid key"] },
				});
			}
		});

		it("sets responseData to undefined in AppError when error has no response", async () => {
			const { service, axios } = createService();
			(axios.post as jest.Mock).mockRejectedValue(new Error("timeout"));

			try {
				await service.requestPagerDuty(args);
				expect.unreachable("should have thrown");
			} catch (err: any) {
				expect(err.details).toEqual({ responseData: undefined });
			}
		});
	});

	// ── requestMatrix ────────────────────────────────────────────────────────

	describe("requestMatrix", () => {
		const args = {
			homeserverUrl: "https://matrix.example.com",
			accessToken: "token-abc",
			roomId: "!room:example.com",
			message: "<b>Alert</b>",
		};

		it("sends correct payload and returns success response", async () => {
			const { service, axios } = createService();
			(axios.post as jest.Mock).mockResolvedValue({ status: 200, data: { event_id: "$abc" } });

			const result = await service.requestMatrix(args);

			expect(result).toEqual({
				status: true,
				code: 200,
				message: "Successfully sent Matrix notification",
			});
			expect(axios.post).toHaveBeenCalledWith(
				"https://matrix.example.com/_matrix/client/v3/rooms/!room:example.com/send/m.room.message?access_token=token-abc",
				{
					msgtype: "m.text",
					body: "<b>Alert</b>",
					format: "org.matrix.custom.html",
					formatted_body: "<b>Alert</b>",
				},
				{ headers: { "Content-Type": "application/json" } }
			);
		});

		it("returns failure with response data on axios error with response (Error instance)", async () => {
			const { service, axios, logger } = createService();
			const axiosError = Object.assign(new Error("Forbidden"), {
				response: { status: 403, data: { errcode: "M_FORBIDDEN" } },
			});
			(axios.post as jest.Mock).mockRejectedValue(axiosError);

			const result = await service.requestMatrix(args);

			expect(result).toEqual({
				status: false,
				code: 403,
				message: "Failed to send Matrix notification",
				payload: { errcode: "M_FORBIDDEN" },
			});
			expect(logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Forbidden",
					service: "NetworkService",
					method: "requestMatrix",
				})
			);
		});

		it("returns NETWORK_ERROR when axios error response has no status", async () => {
			const { service, axios } = createService();
			const axiosError = Object.assign(new Error("timeout"), {
				response: { status: 0, data: undefined },
			});
			(axios.post as jest.Mock).mockRejectedValue(axiosError);

			const result = await service.requestMatrix(args);

			expect(result.code).toBe(NETWORK_ERROR);
		});

		it("returns failure with NETWORK_ERROR on Error without response property", async () => {
			const { service, axios, logger } = createService();
			(axios.post as jest.Mock).mockRejectedValue(new Error("DNS failure"));

			const result = await service.requestMatrix(args);

			expect(result).toEqual({
				status: false,
				code: NETWORK_ERROR,
				message: "Failed to send Matrix notification",
			});
			// First warn call is from the Error instanceof branch
			expect(logger.warn).toHaveBeenCalledTimes(2);
		});

		it("returns failure with NETWORK_ERROR on non-Error thrown value", async () => {
			const { service, axios, logger } = createService();
			(axios.post as jest.Mock).mockRejectedValue("string error");

			const result = await service.requestMatrix(args);

			expect(result).toEqual({
				status: false,
				code: NETWORK_ERROR,
				message: "Failed to send Matrix notification",
			});
			expect(logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "string error",
					service: "NetworkService",
					method: "requestMatrix",
				})
			);
		});

		it("returns NETWORK_ERROR when Error has response key but response is undefined", async () => {
			const { service, axios } = createService();
			const axiosError = Object.assign(new Error("fail"), { response: undefined });
			(axios.post as jest.Mock).mockRejectedValue(axiosError);

			const result = await service.requestMatrix(args);

			expect(result.code).toBe(NETWORK_ERROR);
		});

		it("returns NETWORK_ERROR when Error response has undefined status", async () => {
			const { service, axios } = createService();
			const axiosError = Object.assign(new Error("fail"), {
				response: { status: undefined, data: { error: "unknown" } },
			});
			(axios.post as jest.Mock).mockRejectedValue(axiosError);

			const result = await service.requestMatrix(args);

			expect(result.code).toBe(NETWORK_ERROR);
			expect(result.payload).toEqual({ error: "unknown" });
		});
	});
});
