import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";
import { BufferService } from "../../../src/service/infrastructure/bufferService.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import type { ICheckService } from "../../../src/service/business/checkService.ts";
import type { IGeoChecksService } from "../../../src/service/business/geoChecksService.ts";
import type { ISettingsService } from "../../../src/service/system/settingsService.ts";
import type { Check, GeoCheck } from "../../../src/types/index.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const createMockCheckService = () =>
	({
		createChecks: jest.fn().mockResolvedValue([]),
	}) as unknown as jest.Mocked<ICheckService>;

const createMockGeoChecksService = () =>
	({
		createGeoChecks: jest.fn().mockResolvedValue([]),
	}) as unknown as jest.Mocked<IGeoChecksService>;

const createMockSettingsService = (nodeEnv: string = "development") =>
	({
		getSettings: jest.fn().mockReturnValue({ nodeEnv }),
	}) as unknown as jest.Mocked<ISettingsService>;

const makeCheck = (overrides?: Partial<Check>): Check =>
	({
		id: "check-1",
		metadata: { monitorId: "mon-1", teamId: "team-1", type: "http" },
		status: true,
		statusCode: 200,
		responseTime: 100,
		message: "OK",
		...overrides,
	}) as Check;

const makeGeoCheck = (overrides?: Partial<GeoCheck>): GeoCheck =>
	({
		id: "geo-1",
		monitorId: "mon-1",
		...overrides,
	}) as GeoCheck;

const createService = (nodeEnv: string = "development") => {
	const logger = createMockLogger();
	const checkService = createMockCheckService();
	const geoChecksService = createMockGeoChecksService();
	const settingsService = createMockSettingsService(nodeEnv);
	const service = new BufferService(logger as any, checkService, geoChecksService, settingsService);
	return { service, logger, checkService, geoChecksService };
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("BufferService", () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	// ── Static / instance properties ─────────────────────────────────────

	describe("serviceName", () => {
		it("returns BufferService from static property", () => {
			expect(BufferService.SERVICE_NAME).toBe("BufferService");
		});

		it("returns BufferService from instance getter", () => {
			const { service } = createService();
			expect(service.serviceName).toBe("BufferService");
		});
	});

	// ── constructor ──────────────────────────────────────────────────────

	describe("constructor", () => {
		it("logs initialization with development timeout", () => {
			const { logger } = createService("development");
			expect(logger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining("0.01s"),
					service: "BufferService",
					method: "constructor",
				})
			);
		});

		it("uses 60s timeout in non-development environment", () => {
			const { logger } = createService("production");
			expect(logger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining("60s"),
				})
			);
		});

		it("schedules a flush on construction", () => {
			createService();
			expect(jest.getTimerCount()).toBeGreaterThanOrEqual(1);
		});
	});

	// ── addToBuffer ──────────────────────────────────────────────────────

	describe("addToBuffer", () => {
		it("adds a check to the buffer", async () => {
			const { service, checkService } = createService();
			const check = makeCheck();

			service.addToBuffer(check);
			await service.flushBuffer();

			expect(checkService.createChecks).toHaveBeenCalledWith([check]);
		});

		it("adds multiple checks to the buffer", async () => {
			const { service, checkService } = createService();
			const check1 = makeCheck({ id: "c1" });
			const check2 = makeCheck({ id: "c2" });

			service.addToBuffer(check1);
			service.addToBuffer(check2);
			await service.flushBuffer();

			expect(checkService.createChecks).toHaveBeenCalledWith([check1, check2]);
		});

		it("logs error if push throws", () => {
			const { service, logger } = createService();
			// Force buffer.push to throw by making buffer non-extensible
			Object.defineProperty(service, "buffer", { value: Object.freeze([]) });

			service.addToBuffer(makeCheck());

			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					service: "BufferService",
					method: "addToBuffer",
				})
			);
		});

		it("logs 'Unknown error' for non-Error thrown values", () => {
			const { service, logger } = createService();
			Object.defineProperty(service, "buffer", {
				value: {
					push: () => {
						throw "string error";
					},
				},
			});

			service.addToBuffer(makeCheck());

			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Unknown error",
					stack: undefined,
				})
			);
		});
	});

	// ── addGeoCheckToBuffer ──────────────────────────────────────────────

	describe("addGeoCheckToBuffer", () => {
		it("adds a geo check to the buffer", async () => {
			const { service, geoChecksService } = createService();
			const geoCheck = makeGeoCheck();

			service.addGeoCheckToBuffer(geoCheck);
			await service.flushGeoBuffer();

			expect(geoChecksService.createGeoChecks).toHaveBeenCalledWith([geoCheck]);
		});

		it("logs error if push throws", () => {
			const { service, logger } = createService();
			Object.defineProperty(service, "geoBuffer", { value: Object.freeze([]) });

			service.addGeoCheckToBuffer(makeGeoCheck());

			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					service: "BufferService",
					method: "addGeoCheckToBuffer",
				})
			);
		});

		it("logs 'Unknown error' for non-Error thrown values", () => {
			const { service, logger } = createService();
			Object.defineProperty(service, "geoBuffer", {
				value: {
					push: () => {
						throw 42;
					},
				},
			});

			service.addGeoCheckToBuffer(makeGeoCheck());

			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Unknown error",
					stack: undefined,
				})
			);
		});
	});

	// ── removeCheckFromBuffer ────────────────────────────────────────────

	describe("removeCheckFromBuffer", () => {
		it("removes a check by id and returns true", () => {
			const { service } = createService();
			const check = makeCheck({ id: "c1" });
			service.addToBuffer(check);

			const result = service.removeCheckFromBuffer(check);

			expect(result).toBe(true);
		});

		it("returns false when check is not found", () => {
			const { service } = createService();
			service.addToBuffer(makeCheck({ id: "c1" }));

			const result = service.removeCheckFromBuffer(makeCheck({ id: "c999" }));

			expect(result).toBe(false);
		});

		it("returns false when passed a falsy value", () => {
			const { service } = createService();

			const result = service.removeCheckFromBuffer(null as any);

			expect(result).toBe(false);
		});

		it("matches by metadata fields when ids are missing", async () => {
			const { service, checkService } = createService();
			const check = makeCheck({
				id: undefined as any,
				metadata: { monitorId: "mon-1", teamId: "team-1", type: "http" } as any,
				status: true,
				statusCode: 200,
				responseTime: 50,
				message: "OK",
			});
			service.addToBuffer(check);

			const result = service.removeCheckFromBuffer(check);

			expect(result).toBe(true);
			await service.flushBuffer();
			expect(checkService.createChecks).not.toHaveBeenCalled();
		});

		it("does not match when metadata fields differ", () => {
			const { service } = createService();
			const check = makeCheck({
				id: undefined as any,
				metadata: { monitorId: "mon-1", teamId: "team-1", type: "http" } as any,
				status: true,
				statusCode: 200,
				responseTime: 50,
				message: "OK",
			});
			service.addToBuffer(check);

			const different = makeCheck({
				id: undefined as any,
				metadata: { monitorId: "mon-1", teamId: "team-1", type: "http" } as any,
				status: false,
				statusCode: 500,
				responseTime: 50,
				message: "Error",
			});
			const result = service.removeCheckFromBuffer(different);

			expect(result).toBe(false);
		});

		it("logs error and returns false on exception", () => {
			const { service, logger } = createService();
			// Force findIndex to throw
			Object.defineProperty(service, "buffer", {
				value: {
					findIndex: () => {
						throw new Error("findIndex failed");
					},
				},
			});

			const result = service.removeCheckFromBuffer(makeCheck());

			expect(result).toBe(false);
			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "findIndex failed",
					service: "BufferService",
					method: "removeCheckFromBuffer",
				})
			);
		});

		it("logs 'Unknown error' for non-Error thrown values in removeCheckFromBuffer", () => {
			const { service, logger } = createService();
			Object.defineProperty(service, "buffer", {
				value: {
					findIndex: () => {
						throw null;
					},
				},
			});

			const result = service.removeCheckFromBuffer(makeCheck());

			expect(result).toBe(false);
			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Unknown error",
					stack: undefined,
				})
			);
		});
	});

	// ── scheduleNextFlush ────────────────────────────────────────────────

	describe("scheduleNextFlush", () => {
		it("clears existing timer and sets a new one", () => {
			const { service } = createService();
			// Constructor already scheduled one flush
			const initialTimerCount = jest.getTimerCount();

			service.scheduleNextFlush();

			// Should still have timers (cleared old, set new)
			expect(jest.getTimerCount()).toBe(initialTimerCount);
		});

		it("flushes buffer and geo buffer when timer fires", async () => {
			const { service, checkService, geoChecksService } = createService();
			service.addToBuffer(makeCheck());
			service.addGeoCheckToBuffer(makeGeoCheck());

			await jest.advanceTimersByTimeAsync(10);

			expect(checkService.createChecks).toHaveBeenCalled();
			expect(geoChecksService.createGeoChecks).toHaveBeenCalled();
		});

		it("reschedules after flush completes", async () => {
			const { service, checkService } = createService();
			(checkService.createChecks as jest.Mock).mockResolvedValue([]);

			service.addToBuffer(makeCheck());
			await jest.advanceTimersByTimeAsync(10);

			// Add another check and advance again to confirm rescheduling
			service.addToBuffer(makeCheck({ id: "c2" }));
			await jest.advanceTimersByTimeAsync(10);

			expect(checkService.createChecks).toHaveBeenCalledTimes(2);
		});

		it("reschedules even when flush throws", async () => {
			const { service, checkService, logger } = createService();
			(checkService.createChecks as jest.Mock).mockRejectedValueOnce(new Error("DB down"));
			service.addToBuffer(makeCheck());

			await jest.advanceTimersByTimeAsync(10);

			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "DB down",
					method: "flushBuffer",
				})
			);

			// Should still reschedule — add another check and flush
			(checkService.createChecks as jest.Mock).mockResolvedValue([]);
			service.addToBuffer(makeCheck({ id: "c2" }));
			await jest.advanceTimersByTimeAsync(10);

			expect(checkService.createChecks).toHaveBeenCalledTimes(2);
		});

		it("logs error and reschedules when flush throws past its own catch", async () => {
			const { service, logger } = createService();
			// Override flushBuffer to throw past its own try/catch
			service.flushBuffer = jest.fn<() => Promise<void>>().mockRejectedValueOnce(new Error("unexpected"));

			await jest.advanceTimersByTimeAsync(10);

			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "unexpected",
					method: "scheduleNextFlush",
				})
			);
		});

		it("logs 'Unknown error' when flush throws non-Error past its own catch", async () => {
			const { service, logger } = createService();
			service.flushBuffer = jest.fn<() => Promise<void>>().mockRejectedValueOnce("string error");

			await jest.advanceTimersByTimeAsync(10);

			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Unknown error",
					method: "scheduleNextFlush",
					stack: undefined,
				})
			);
		});
	});

	// ── flushBuffer ──────────────────────────────────────────────────────

	describe("flushBuffer", () => {
		it("does nothing when buffer is empty", async () => {
			const { service, checkService } = createService();

			await service.flushBuffer();

			expect(checkService.createChecks).not.toHaveBeenCalled();
		});

		it("flushes checks to checksService and clears buffer", async () => {
			const { service, checkService } = createService();
			const check = makeCheck();
			service.addToBuffer(check);

			await service.flushBuffer();

			expect(checkService.createChecks).toHaveBeenCalledWith([check]);
			// Buffer should be empty now
			await service.flushBuffer();
			expect(checkService.createChecks).toHaveBeenCalledTimes(1);
		});

		it("logs debug message before flushing", async () => {
			const { service, logger } = createService();
			service.addToBuffer(makeCheck());

			await service.flushBuffer();

			expect(logger.debug).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Flushing 1 checks to database",
					service: "BufferService",
					method: "flushBuffer",
				})
			);
		});

		it("clears buffer even on error to prevent infinite retries", async () => {
			const { service, checkService, logger } = createService();
			(checkService.createChecks as jest.Mock).mockRejectedValue(new Error("DB write failed"));
			service.addToBuffer(makeCheck());

			await service.flushBuffer();

			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "DB write failed",
					method: "flushBuffer",
				})
			);
			// Buffer should be cleared
			await service.flushBuffer();
			expect(checkService.createChecks).toHaveBeenCalledTimes(1);
		});

		it("logs 'Unknown error' for non-Error thrown values", async () => {
			const { service, checkService, logger } = createService();
			(checkService.createChecks as jest.Mock).mockRejectedValue(null);
			service.addToBuffer(makeCheck());

			await service.flushBuffer();

			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Unknown error",
					method: "flushBuffer",
					stack: undefined,
				})
			);
		});
	});

	// ── flushGeoBuffer ───────────────────────────────────────────────────

	describe("flushGeoBuffer", () => {
		it("does nothing when geo buffer is empty", async () => {
			const { service, geoChecksService } = createService();

			await service.flushGeoBuffer();

			expect(geoChecksService.createGeoChecks).not.toHaveBeenCalled();
		});

		it("flushes geo checks and clears buffer", async () => {
			const { service, geoChecksService } = createService();
			const geoCheck = makeGeoCheck();
			service.addGeoCheckToBuffer(geoCheck);

			await service.flushGeoBuffer();

			expect(geoChecksService.createGeoChecks).toHaveBeenCalledWith([geoCheck]);
			// Buffer should be empty now
			await service.flushGeoBuffer();
			expect(geoChecksService.createGeoChecks).toHaveBeenCalledTimes(1);
		});

		it("logs debug message before flushing", async () => {
			const { service, logger } = createService();
			service.addGeoCheckToBuffer(makeGeoCheck());

			await service.flushGeoBuffer();

			expect(logger.debug).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Flushing 1 geo checks to database",
					service: "BufferService",
					method: "flushGeoBuffer",
				})
			);
		});

		it("clears geo buffer even on error", async () => {
			const { service, geoChecksService, logger } = createService();
			(geoChecksService.createGeoChecks as jest.Mock).mockRejectedValue(new Error("DB error"));
			service.addGeoCheckToBuffer(makeGeoCheck());

			await service.flushGeoBuffer();

			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "DB error",
					method: "flushGeoBuffer",
				})
			);
			// Buffer should be cleared
			await service.flushGeoBuffer();
			expect(geoChecksService.createGeoChecks).toHaveBeenCalledTimes(1);
		});

		it("logs 'Unknown error' for non-Error thrown values", async () => {
			const { service, geoChecksService, logger } = createService();
			(geoChecksService.createGeoChecks as jest.Mock).mockRejectedValue(undefined);
			service.addGeoCheckToBuffer(makeGeoCheck());

			await service.flushGeoBuffer();

			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Unknown error",
					method: "flushGeoBuffer",
					stack: undefined,
				})
			);
		});
	});
});
