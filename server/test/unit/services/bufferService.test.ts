import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";
import { BufferService } from "../../../src/service/bufferService.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import type { IGeoChecksService } from "../../../src/domain/geo-checks/geo-check.service.ts";
import type { ISettingsService } from "../../../src/domain/app-settings/app-settings.service.ts";
import type { Check } from "../../../src/domain/checks/check.type.ts";
import type { GeoCheck } from "../../../src/domain/geo-checks/geo-check.type.ts";
import type { IDockerLogsService } from "../../../src/domain/docker/docker-log.service.ts";
import type { DockerLog } from "../../../src/domain/docker/docker-log.type.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const createMockGeoChecksService = () =>
	({
		createGeoChecks: jest.fn().mockResolvedValue([]),
	}) as unknown as jest.Mocked<IGeoChecksService>;

const createMockDockerLogsService = () =>
	({
		createDockerLogs: jest.fn().mockResolvedValue(0),
	}) as unknown as jest.Mocked<IDockerLogsService>;

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
		createdAt: "2026-01-01T00:00:00.000Z",
		updatedAt: "2026-01-01T00:00:00.000Z",
		...overrides,
	}) as Check;

const makeGeoCheck = (overrides?: Partial<GeoCheck>): GeoCheck =>
	({
		id: "geo-1",
		monitorId: "mon-1",
		...overrides,
	}) as GeoCheck;

const makeDockerLog = (overrides?: Partial<DockerLog>): DockerLog =>
	({
		id: "docker-log-1",
		metadata: { monitorId: "mon-1", teamId: "team-1", containerId: "container-1", containerName: "web" },
		lines: [{ ts: "2026-01-01T00:00:00.000000000Z", stream: "stdout", text: "ready" }],
		gap: false,
		checkedAt: "2026-01-01T00:00:01.000Z",
		expiry: "2026-01-08T00:00:01.000Z",
		createdAt: "2026-01-01T00:00:01.000Z",
		updatedAt: "2026-01-01T00:00:01.000Z",
		...overrides,
	}) as DockerLog;

const createService = (nodeEnv: string = "development") => {
	const logger = createMockLogger();
	const ingest = jest.fn<(checks: Check[]) => Promise<void>>().mockResolvedValue(undefined);
	const geoChecksService = createMockGeoChecksService();
	const dockerLogsService = createMockDockerLogsService();
	const settingsService = createMockSettingsService(nodeEnv);
	const service = new BufferService(logger as any, geoChecksService, dockerLogsService, settingsService, ingest);
	return { service, logger, ingest, geoChecksService, dockerLogsService };
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

	// ── constructor ──────────────────────────────────────────────────────

	describe("constructor", () => {
		it("logs initialization with development timeout", () => {
			const { logger } = createService("development");
			expect(logger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining("1s"),
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
			const { service, ingest } = createService();
			const check = makeCheck();

			service.addToBuffer(check);
			await service.flushBuffer();

			expect(ingest).toHaveBeenCalledWith([check]);
		});

		it("adds multiple checks to the buffer", async () => {
			const { service, ingest } = createService();
			const check1 = makeCheck({ id: "c1" });
			const check2 = makeCheck({ id: "c2" });

			service.addToBuffer(check1);
			service.addToBuffer(check2);
			await service.flushBuffer();

			expect(ingest).toHaveBeenCalledWith([check1, check2]);
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
	});

	describe("addDockerLogToBuffer", () => {
		it("adds a docker log to the buffer", async () => {
			const { service, dockerLogsService } = createService();
			const dockerLog = makeDockerLog();

			service.addDockerLogToBuffer(dockerLog);
			await service.flushDockerLogsBuffer();

			expect(dockerLogsService.createDockerLogs).toHaveBeenCalledWith([dockerLog]);
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

		it("flushes all buffers when timer fires", async () => {
			const { service, ingest, geoChecksService, dockerLogsService } = createService();
			service.addToBuffer(makeCheck());
			service.addGeoCheckToBuffer(makeGeoCheck());
			service.addDockerLogToBuffer(makeDockerLog());

			await jest.advanceTimersByTimeAsync(1000);

			expect(ingest).toHaveBeenCalledWith([expect.objectContaining({ id: "check-1" })]);
			expect(geoChecksService.createGeoChecks).toHaveBeenCalled();
			expect(dockerLogsService.createDockerLogs).toHaveBeenCalled();
		});

		it("reschedules after flush completes", async () => {
			const { service, ingest } = createService();

			service.addToBuffer(makeCheck());
			await jest.advanceTimersByTimeAsync(1000);

			// Add another check and advance again to confirm rescheduling
			service.addToBuffer(makeCheck({ id: "c2" }));
			await jest.advanceTimersByTimeAsync(1000);

			expect(ingest).toHaveBeenCalledTimes(2);
		});

		it("reschedules even when flush throws", async () => {
			const { service, ingest, logger } = createService();
			ingest.mockRejectedValueOnce(new Error("DB down"));
			service.addToBuffer(makeCheck());

			await jest.advanceTimersByTimeAsync(1000);

			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "DB down",
					method: "flushBuffer",
				})
			);

			// Should still reschedule — add another check and flush
			service.addToBuffer(makeCheck({ id: "c2" }));
			await jest.advanceTimersByTimeAsync(1000);

			expect(ingest).toHaveBeenCalledTimes(2);
		});

		it("logs error and reschedules when flush throws past its own catch", async () => {
			const { service, logger } = createService();
			// Override flushBuffer to throw past its own try/catch
			service.flushBuffer = jest.fn<() => Promise<void>>().mockRejectedValueOnce(new Error("unexpected"));

			await jest.advanceTimersByTimeAsync(1000);

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

			await jest.advanceTimersByTimeAsync(1000);

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
		it("hands an empty batch to ingest so the pipeline can retry anything it left unarmed", async () => {
			const { service, ingest, logger } = createService();

			await service.flushBuffer();

			expect(ingest).toHaveBeenCalledWith([]);
			expect(logger.debug).not.toHaveBeenCalled();
		});

		it("hands the batch to ingest and clears the buffer", async () => {
			const { service, ingest } = createService();
			const check = makeCheck();
			service.addToBuffer(check);

			await service.flushBuffer();

			expect(ingest).toHaveBeenNthCalledWith(1, [check]);
			// Buffer should be empty now
			await service.flushBuffer();
			expect(ingest).toHaveBeenNthCalledWith(2, []);
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
			const { service, ingest, logger } = createService();
			ingest.mockRejectedValueOnce(new Error("DB write failed"));
			const check = makeCheck();
			service.addToBuffer(check);

			await service.flushBuffer();

			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "DB write failed",
					method: "flushBuffer",
				})
			);
			// Buffer should be cleared: the failed batch is not handed over again
			await service.flushBuffer();
			expect(ingest).toHaveBeenNthCalledWith(2, []);
		});

		it("logs 'Unknown error' for non-Error thrown values", async () => {
			const { service, ingest, logger } = createService();
			ingest.mockRejectedValue(null);
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

	describe("flushDockerLogsBuffer", () => {
		it("does nothing when the docker log buffer is empty", async () => {
			const { service, dockerLogsService } = createService();

			await service.flushDockerLogsBuffer();

			expect(dockerLogsService.createDockerLogs).not.toHaveBeenCalled();
		});

		it("flushes the batch and clears it", async () => {
			const { service, dockerLogsService } = createService();
			const dockerLog = makeDockerLog();
			service.addDockerLogToBuffer(dockerLog);

			await service.flushDockerLogsBuffer();
			await service.flushDockerLogsBuffer();

			expect(dockerLogsService.createDockerLogs).toHaveBeenCalledWith([dockerLog]);
			expect(dockerLogsService.createDockerLogs).toHaveBeenCalledTimes(1);
		});

		it("does not drop logs added while a flush is in flight", async () => {
			const { service, dockerLogsService } = createService();
			let resolveWrite!: (value: number) => void;
			(dockerLogsService.createDockerLogs as jest.Mock).mockImplementationOnce(() => new Promise<number>((resolve) => (resolveWrite = resolve)));
			const first = makeDockerLog({ id: "docker-log-1" });
			const second = makeDockerLog({ id: "docker-log-2" });
			service.addDockerLogToBuffer(first);

			const flush = service.flushDockerLogsBuffer();
			service.addDockerLogToBuffer(second);
			resolveWrite(1);
			await flush;
			await service.flushDockerLogsBuffer();

			expect(dockerLogsService.createDockerLogs).toHaveBeenNthCalledWith(1, [first]);
			expect(dockerLogsService.createDockerLogs).toHaveBeenNthCalledWith(2, [second]);
		});

		it("drops a failed batch and logs the error", async () => {
			const { service, dockerLogsService, logger } = createService();
			(dockerLogsService.createDockerLogs as jest.Mock).mockRejectedValueOnce(new Error("DB error"));
			service.addDockerLogToBuffer(makeDockerLog());

			await service.flushDockerLogsBuffer();
			await service.flushDockerLogsBuffer();

			expect(dockerLogsService.createDockerLogs).toHaveBeenCalledTimes(1);
			expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: "DB error", method: "flushDockerLogsBuffer" }));
		});
	});

	// ── shutdown ─────────────────────────────────────────────────────────────

	describe("shutdown", () => {
		it("stops the flush timer and flushes all buffers", async () => {
			const { service, ingest, geoChecksService, dockerLogsService } = createService();
			service.addToBuffer(makeCheck());
			service.addGeoCheckToBuffer(makeGeoCheck());
			service.addDockerLogToBuffer(makeDockerLog());

			await service.shutdown();

			expect(ingest).toHaveBeenCalledTimes(1);
			expect(geoChecksService.createGeoChecks).toHaveBeenCalledTimes(1);
			expect(dockerLogsService.createDockerLogs).toHaveBeenCalledTimes(1);

			// Timer is cleared: advancing past the flush interval triggers no further flush.
			await jest.advanceTimersByTimeAsync(60 * 1000);
			expect(ingest).toHaveBeenCalledTimes(1);
		});

		it("is safe to call with empty buffers", async () => {
			const { service, ingest, geoChecksService, dockerLogsService } = createService();

			await service.shutdown();

			expect(ingest).toHaveBeenCalledWith([]);
			expect(geoChecksService.createGeoChecks).not.toHaveBeenCalled();
			expect(dockerLogsService.createDockerLogs).not.toHaveBeenCalled();
		});
	});
});
